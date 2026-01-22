"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  Save,
  Play,
  Pause,
  Settings,
} from "lucide-react";
import styles from "./VideoPlayer.module.css";

export default function VideoPlayer() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fps, setFps] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ time: number; url: string }[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCenter, setZoomCenter] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    generateThumbnails(file);
  };

  const generateThumbnails = async (file: File) => {
    console.log("Starting thumbnail generation...");
    // Determine number of particles based on window width or fixed count
    // iPhone style: continuous strip. Let's maximize fit.
    const thumbCount = 30; 
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "auto"; // Ensure metadata loads
    
    // Wait for metadata to get duration
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        console.log("Metadata loaded, duration:", video.duration);
        resolve(true);
      };
      // Fallback if metadata takes too long or fails
      video.onerror = (e) => {
          console.error("Error loading video for thumbnails", e);
          resolve(false);
      }
    });

    const duration = video.duration;
    if (!duration || duration === Infinity || isNaN(duration)) {
        console.error("Invalid duration for thumbnails");
        return;
    }

    const interval = duration / thumbCount;
    const thumbs: { time: number; url: string }[] = [];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Aspect ratio 16:9ish assumption or use actual video ratio
    const thumbWidth = 160; 
    const thumbHeight = 90;
    canvas.width = thumbWidth;
    canvas.height = thumbHeight;

    console.log("Generating thumbnails loop...");
    for (let i = 0; i < thumbCount; i++) {
        const time = i * interval;
        video.currentTime = time;
        await new Promise((resolve) => { 
           // Seeked event is reliable, but sometimes needs a push if hung
           video.onseeked = () => resolve(true);
           // Timeout escape hatch
           setTimeout(() => resolve(true), 2000); // 2s timeout per frame
        });
        
        if (ctx) {
            ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight);
            thumbs.push({
                time,
                url: canvas.toDataURL('image/jpeg', 0.5) // Lower quality for speed
            });
        }
    }
    
    console.log("Thumbnails generated:", thumbs.length);
    setThumbnails(thumbs);
    // Cleanup
    URL.revokeObjectURL(videoUrl);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      processFile(file);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Global mouseup/touchend to ensure zoom deactivates even if released outside slider
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isZoomed) {
        console.log("Global mouseup - deactivating zoom");
        setIsZoomed(false);
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isZoomed]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekFrame = useCallback(
    (direction: "forward" | "backward") => {
      if (videoRef.current) {
        const frameDuration = 1 / fps;
        const newTime =
          direction === "forward"
            ? Math.min(
                videoRef.current.currentTime + frameDuration,
                videoRef.current.duration,
              )
            : Math.max(videoRef.current.currentTime - frameDuration, 0);

        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [fps],
  );

  const seekToTime = (time: number) => {
      if (videoRef.current) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
      }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoSrc) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        seekFrame("forward");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekFrame("backward");
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [videoSrc, seekFrame, isPlaying]);

  const saveFrame = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw frame to canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const defaultFilename = `frame-${currentTime.toFixed(2)}`;

    try {
      // @ts-expect-error - File System Access API types are not fully standardized in all setups
      if (window.showSaveFilePicker) {
        // Use Native Save Dialog
        // @ts-expect-error - File System Access API
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [
            {
              description: "PNG Image",
              accept: { "image/png": [".png"] },
            },
            {
              description: "JPEG Image",
              accept: { "image/jpeg": [".jpg"] },
            },
            {
              description: "WebP Image",
              accept: { "image/webp": [".webp"] },
            },
          ],
        });

        const writable = await handle.createWritable();
        
        // Determine format based on chosen extension (default to png if unclear)
        const name = handle.name.toLowerCase();
        let mimeType = "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) mimeType = "image/jpeg";
        if (name.endsWith(".webp")) mimeType = "image/webp";

        // Convert canvas to blob
        const blob = await new Promise<Blob | null>(resolve => 
          canvas.toBlob(resolve, mimeType)
        );
        
        if (blob) {
          await writable.write(blob);
          await writable.close();
        }
      } else {
        // Fallback for browsers without File System Access API
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${defaultFilename}.png`;
        link.click();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to save frame:', err);
      }
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.container}>
      {!videoSrc ? (
        <div 
          className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload size={48} style={{ marginBottom: "1rem" }} />
          <h3>Click or Drag & Drop Video</h3>
          <p>Supports MP4, WebM, MOV</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="video/*" 
            className={styles.hiddenInput} 
          />
        </div>
      ) : (
        <>
          <div className={styles.videoWrapper}>
            <video
              ref={videoRef}
              src={videoSrc}
              className={styles.video}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
            />
          </div>

          <div className={styles.controls}>
            <div className={styles.controlsHeader}>
              <div className={styles.buttonGroup}>
                <button
                  className={styles.button}
                  onClick={() => seekFrame("backward")}
                  title="Previous Frame (Left Arrow)"
                >
                  <ChevronLeft size={20} />
                </button>
                <button className={styles.button} onClick={togglePlay}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  className={styles.button}
                  onClick={() => seekFrame("forward")}
                  title="Next Frame (Right Arrow)"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className={styles.timeDisplay}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              <div className={styles.buttonGroup}>
                <button
                  className={`${styles.button} ${styles.primaryButton}`}
                  onClick={saveFrame}
                >
                  <Save size={18} />
                  <span>Save Frame</span>
                </button>
              </div>
            </div>

            <div className={styles.timeline}>
              <input
                type="range"
                min={0}
                max={duration}
                step="0.01"
                value={currentTime}
                onChange={(e) => {
                  if (videoRef.current) {
                    const newTime = parseFloat(e.target.value);
                    videoRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                    if (isZoomed) {
                      setZoomCenter(newTime);
                    }
                  }
                }}
                onMouseDown={() => {
                  console.log("Slider mousedown - activating zoom");
                  setIsZoomed(true);
                  setZoomCenter(currentTime);
                }}
                onMouseUp={() => {
                  console.log("Slider mouseup - deactivating zoom");
                  setIsZoomed(false);
                }}
                onTouchStart={() => {
                  console.log("Slider touchstart - activating zoom");
                  setIsZoomed(true);
                  setZoomCenter(currentTime);
                }}
                onTouchEnd={() => {
                  console.log("Slider touchend - deactivating zoom");
                  setIsZoomed(false);
                }}
                className={styles.slider}
              />
              
              {thumbnails.length > 0 && (() => {
                  // Filter thumbnails for zoomed view
                  // Dynamic zoom radius: 10% of duration, min 0.5s, max 5s
                  const zoomRadius = Math.min(5, Math.max(0.5, duration * 0.1));
                  const displayThumbs = isZoomed 
                    ? thumbnails.filter(t => t.time >= zoomCenter - zoomRadius && t.time <= zoomCenter + zoomRadius)
                    : thumbnails;
                  
                  console.log("Zoom state:", { isZoomed, zoomCenter, displayCount: displayThumbs.length, totalCount: thumbnails.length });
                  
                  return (
                  <div 
                    className={styles.filmstripContainer}
                    style={{
                      border: isZoomed ? '2px solid #00ff00' : 'none', // Green border when zoomed
                      transition: 'border 0.1s ease'
                    }}
                  >
                      <div className={styles.filmstrip}>
                          {displayThumbs.length > 0 ? displayThumbs.map((thumb) => (
                              <div 
                                key={thumb.time} 
                                className={styles.thumbnailContainer}
                                style={{ 
                                    flexBasis: `${100 / displayThumbs.length}%`,
                                    width: `${100 / displayThumbs.length}%`,
                                }}
                                onClick={() => seekToTime(thumb.time)}
                              >
                                  <img src={thumb.url} alt={`${thumb.time.toFixed(1)}s`} className={styles.thumbnail} />
                              </div>
                          )) : (
                            <div style={{ color: 'white', padding: '1rem' }}>No frames in zoomed range</div>
                          )}
                      </div>
                      {isZoomed && (
                        <div className={styles.zoomIndicator}>
                          ZOOMED: {Math.max(0, zoomCenter - zoomRadius).toFixed(1)}s - {Math.min(duration, zoomCenter + zoomRadius).toFixed(1)}s ({displayThumbs.length} frames)
                        </div>
                      )}
                  </div>
                  );
              })()}
            </div>

            <p className={styles.helpText}>
              Use <b>Arrow Keys</b> to scrub frame by frame. Space to
              Play/Pause. Click timeline thumbnails to jump.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
