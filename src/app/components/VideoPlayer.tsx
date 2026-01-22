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
  X,
  Download,
  Trash2,
  Image as ImageIcon,
  RotateCw,
  FlipHorizontal,
  FlipVertical2,
  Crop,
  Info,
  ChevronDown,
  Volume2,
  VolumeX,
} from "lucide-react";
import styles from "./VideoPlayer.module.css";

interface CapturedImage {
  id: string;
  url: string;
  time: number;
  timestamp: Date;
}

interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  fileSize: number;
  fileName: string;
}

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function VideoPlayer() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ time: number; url: string }[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCenter, setZoomCenter] = useState(0);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [mode, setMode] = useState<'capture' | 'review'>('capture');
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [isSplitView, setIsSplitView] = useState(false);
  const [focusedPanel, setFocusedPanel] = useState<'left' | 'right'>('left');
  const [splitImages, setSplitImages] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  
  // Video metadata
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Adjustment states
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [cropAspect, setCropAspect] = useState<string>('free'); // 'free', '16:9', '4:3', '1:1'
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);

  const processFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoMetadata((prev) => ({
      ...prev!,
      fileSize: file.size,
      fileName: file.name,
      width: 0,
      height: 0,
      duration: 0,
    }));
    // Reset adjustments
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropRegion(null);
    setIsCropping(false);
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
      setVideoMetadata((prev) => ({
        ...prev!,
        width: videoRef.current!.videoWidth,
        height: videoRef.current!.videoHeight,
        duration: videoRef.current!.duration,
      }));
    }
  };

  // Rotation helper
  const rotateVideo = () => {
    setRotation((prev) => (prev + 90) % 360);
  };



  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        const fps = 30; // Standard frame rate for seeking
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
    [],
  );

  const seekToTime = (time: number) => {
      if (videoRef.current) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
      }
  };

  // Capture current frame to collection
  const captureFrame = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    
    // Determine FULL transformed dimensions
    let fullW, fullH;
    if (rotation === 90 || rotation === 270) {
      fullW = video.videoHeight;
      fullH = video.videoWidth;
    } else {
      fullW = video.videoWidth;
      fullH = video.videoHeight;
    }

    // Determine Crop Rect (relative to full transformed frame)
    let cx = 0, cy = 0, cw = fullW, ch = fullH;
    if (cropRegion) {
        cx = (cropRegion.x / 100) * fullW;
        cy = (cropRegion.y / 100) * fullH;
        cw = (cropRegion.width / 100) * fullW;
        ch = (cropRegion.height / 100) * fullH;
    }
    
    // Set canvas to crop size
    canvas.width = cw;
    canvas.height = ch;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Apply adjustments
    ctx.save();
    
    // 1. Shift View to Crop Origin
    ctx.translate(-cx, -cy);

    // 2. Move to Center of FULL image
    ctx.translate(fullW / 2, fullH / 2);
    
    // 3. Rotate
    ctx.rotate((rotation * Math.PI) / 180);
    
    // 4. Flip
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    
    // 5. Draw Video Centered (Always -W/2, -H/2)
    ctx.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2);
    
    ctx.restore();

    const url = canvas.toDataURL("image/png");

    const newImage: CapturedImage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      time: currentTime,
      timestamp: new Date(),
    };

    setCapturedImages((prev) => [...prev, newImage]);
  }, [currentTime, rotation, flipH, flipV, cropRegion]);

  // Delete a captured image
  const deleteImage = (id: string) => {
    setCapturedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Delete all captured images
  const deleteAllImages = () => {
    setCapturedImages([]);
  };

  // Download a single image
  const downloadImage = (img: CapturedImage) => {
    const a = document.createElement("a");
    a.href = img.url;
    a.download = `frame-${img.time.toFixed(2)}s.png`;
    a.click();
  };

  // Download all images
  const downloadAllImages = () => {
    capturedImages.forEach((img, index) => {
      setTimeout(() => {
        downloadImage(img);
      }, index * 100); // Stagger downloads to avoid browser blocking
    });
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
      } else if (e.key === "x" || e.key === "X") {
        e.preventDefault();
        captureFrame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [videoSrc, seekFrame, isPlaying, captureFrame]);

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
          {/* Mode Tabs */}
          <div className={styles.modeTabs}>
            <button
              className={`${styles.modeTab} ${mode === 'capture' ? styles.active : ''}`}
              onClick={() => setMode('capture')}
            >
              <Play size={16} />
              Capture
            </button>
            {capturedImages.length > 0 && (
              <button
                className={`${styles.modeTab} ${mode === 'review' ? styles.active : ''}`}
                onClick={() => setMode('review')}
              >
                <ImageIcon size={16} />
                Review
                <span className={styles.modeTabBadge}>{capturedImages.length}</span>
              </button>
            )}
          </div>

          {/* Capture Mode */}
          {mode === 'capture' && (
          <div className={styles.mainLayout}>
            {/* Video Section */}
            <div className={styles.videoSection}>
              {/* Adjustment Toolbar */}
              <div className={styles.adjustmentToolbar}>
                <div className={styles.toolbarGroup}>
                  <button 
                    className={styles.toolButton}
                    onClick={rotateVideo}
                    title="Rotate 90°"
                  >
                    <RotateCw size={18} />
                    <span>Rotate</span>
                  </button>
                  <button 
                    className={`${styles.toolButton} ${flipH ? styles.activeToggle : ''}`}
                    onClick={() => setFlipH(!flipH)}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal size={18} />
                    <span>Flip H</span>
                  </button>
                  <button 
                    className={`${styles.toolButton} ${flipV ? styles.activeToggle : ''}`}
                    onClick={() => setFlipV(!flipV)}
                    title="Flip Vertical"
                  >
                    <FlipVertical2 size={18} />
                    <span>Flip V</span>
                  </button>
                  <button 
                    className={`${styles.toolButton} ${isCropping ? styles.activeToggle : ''}`}
                    onClick={() => setIsCropping(!isCropping)}
                    title="Crop"
                  >
                    <Crop size={18} />
                    <span>Crop</span>
                  </button>
                  {isCropping && (
                    <select 
                      className={styles.cropSelect}
                      value={cropAspect}
                      onChange={(e) => setCropAspect(e.target.value)}
                    >
                      <option value="free">Free</option>
                      <option value="16:9">16:9</option>
                      <option value="4:3">4:3</option>
                      <option value="1:1">1:1</option>
                      <option value="9:16">9:16</option>
                    </select>
                  )}
                </div>
                {(rotation !== 0 || flipH || flipV || isCropping || cropRegion) && (
                  <button 
                    className={`${styles.toolButton} ${styles.resetButton}`}
                    onClick={() => {
                      setRotation(0);
                      setFlipH(false);
                      setFlipV(false);
                      setCropRegion(null);
                      setIsCropping(false);
                      setCropAspect('free');
                      setIsZoomed(false);
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>

              <div 
                className={styles.videoWrapper} 
                ref={videoWrapperRef}
                style={{
                    aspectRatio: (() => {
                        // Calculate base aspect ratio
                        let baseW = 16, baseH = 9;
                        if (videoMetadata) {
                             if (rotation === 90 || rotation === 270) {
                                 baseW = videoMetadata.height;
                                 baseH = videoMetadata.width;
                             } else {
                                 baseW = videoMetadata.width;
                                 baseH = videoMetadata.height;
                             }
                        }
                        
                        // If crop applied, adjust aspect ratio
                        if (!isCropping && cropRegion) {
                            // Crop dimensions are percentages of the base (rotated) dimensions
                            return `${(baseW * (cropRegion.width / 100))} / ${(baseH * (cropRegion.height / 100))}`;
                        }
                        
                        return `${baseW}/${baseH}`;
                    })()
                }}
              >
                {/* Transform Container for Zoom/Crop */}
                <div 
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        transform: (!isCropping && cropRegion) ? `scale(${100 / cropRegion.width}) translate(${-cropRegion.x}%, ${-cropRegion.y}%)` : 'none',
                        transformOrigin: '0 0',
                        transition: 'transform 0.3s ease'
                    }}
                >
                    <video
                      ref={videoRef}
                      src={videoSrc}
                      className={styles.video}
                      muted={isMuted}
                      style={{ 
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          transform: [
                              `rotate(${rotation}deg)`,
                              flipH ? 'scaleX(-1)' : '',
                              flipV ? 'scaleY(-1)' : '',
                              (rotation === 90 || rotation === 270) && videoMetadata ? `scale(${videoMetadata.width / videoMetadata.height})` : ''
                          ].filter(Boolean).join(' ')
                       }}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onClick={isCropping ? undefined : togglePlay}
                    />
                </div>

                {/* Crop Overlay */}
                {/* Crop Overlay */}
                {isCropping && (
                    <div 
                        className={styles.cropLayer}
                        onMouseDown={(e) => {
                            if (!videoWrapperRef.current) return;
                            const rect = videoWrapperRef.current.getBoundingClientRect();
                            const clientX = e.clientX;
                            const clientY = e.clientY;
                            
                            // Check collisions with handles or box
                            // We need to know where the existing crop is in pixels to check collision?
                            // Or better: attach handlers directly to the DOM elements (Box / Handles)
                            // But keeping one main handler is cleaner for mouseup/move window events.
                            
                            // actually, let's use the stopPropagation approach on the box/handles 
                            // to distinguish from "background click" (new crop).
                            
                            // Logic:
                            // 1. If clicking blank area -> Start New Crop
                            // 2. If clicking Box/Handle -> Handled by their specific onMouseDown (see below)
                            
                            const startX_pct = ((clientX - rect.left) / rect.width) * 100;
                            const startY_pct = ((clientY - rect.top) / rect.height) * 100;
                            
                            const handleNewCropMove = (mv: MouseEvent) => {
                                const currentX_pct = ((mv.clientX - rect.left) / rect.width) * 100;
                                const currentY_pct = ((mv.clientY - rect.top) / rect.height) * 100;
                                
                                const x = Math.max(0, Math.min(100, Math.min(startX_pct, currentX_pct)));
                                const y = Math.max(0, Math.min(100, Math.min(startY_pct, currentY_pct)));
                                let w = Math.abs(currentX_pct - startX_pct);
                                let h = Math.abs(currentY_pct - startY_pct);
                                
                                // Aspect Constraint (New Crop)
                                if (cropAspect !== 'free') {
                                    const aspectParts = cropAspect.split(':');
                                    const targetRatio = parseFloat(aspectParts[0]) / parseFloat(aspectParts[1]); 
                                    const pxRatio = rect.height / rect.width;
                                    const pctRatio = targetRatio * pxRatio; 
                                    
                                    if (w / h > pctRatio) {
                                        h = w / pctRatio;
                                    } else {
                                        w = h * pctRatio;
                                    }
                                }
                                
                                // Clamp
                                if (x + w > 100) w = 100 - x;
                                if (y + h > 100) h = 100 - y;
                                
                                setCropRegion({ x, y, width: w, height: h });
                            };
                            
                            const handleNewCropUp = () => {
                                window.removeEventListener('mousemove', handleNewCropMove);
                                window.removeEventListener('mouseup', handleNewCropUp);
                            };
                            
                            window.addEventListener('mousemove', handleNewCropMove);
                            window.addEventListener('mouseup', handleNewCropUp);
                            
                            // Initial tiny region to start visual feedback immediately
                            setCropRegion({ x: startX_pct, y: startY_pct, width: 0, height: 0 });
                        }}
                    >
                        {cropRegion && (
                            <div 
                                className={styles.cropBox}
                                style={{
                                    left: `${cropRegion.x}%`,
                                    top: `${cropRegion.y}%`,
                                    width: `${cropRegion.width}%`,
                                    height: `${cropRegion.height}%`
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation(); // Block "New Crop"
                                    if (!videoWrapperRef.current) return;
                                    
                                    // Move Logic
                                    const rect = videoWrapperRef.current.getBoundingClientRect();
                                    const startX_px = e.clientX;
                                    const startY_px = e.clientY;
                                    const initialRegion = { ...cropRegion };
                                    
                                    const handleMoveDrag = (mv: MouseEvent) => {
                                        const dx_px = mv.clientX - startX_px;
                                        const dy_px = mv.clientY - startY_px;
                                        
                                        const dx_pct = (dx_px / rect.width) * 100;
                                        const dy_pct = (dy_px / rect.height) * 100;
                                        
                                        let newX = initialRegion.x + dx_pct;
                                        let newY = initialRegion.y + dy_pct;
                                        
                                        // Clamp
                                        newX = Math.max(0, Math.min(100 - initialRegion.width, newX));
                                        newY = Math.max(0, Math.min(100 - initialRegion.height, newY));
                                        
                                        setCropRegion({ ...initialRegion, x: newX, y: newY });
                                    };
                                    
                                    const handleMoveUp = () => {
                                        window.removeEventListener('mousemove', handleMoveDrag);
                                        window.removeEventListener('mouseup', handleMoveUp);
                                    };
                                    
                                    window.addEventListener('mousemove', handleMoveDrag);
                                    window.addEventListener('mouseup', handleMoveUp);
                                }}
                            >
                                {/* Handles */}
                                {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map((dir) => (
                                    <div 
                                        key={dir}
                                        className={`${styles.cropHandle} ${styles['handle'+dir.charAt(0).toUpperCase() + dir.slice(1)]}`}
                                        onMouseDown={(e) => {
                                            e.stopPropagation(); // Block Move/New
                                            if (!videoWrapperRef.current) return;
                                            
                                            const rect = videoWrapperRef.current.getBoundingClientRect();
                                            const startX = e.clientX;
                                            const startY = e.clientY;
                                            const initialRegion = { ...cropRegion };
                                            
                                            const handleResize = (mv: MouseEvent) => {
                                                const dx_px = mv.clientX - startX;
                                                const dy_px = mv.clientY - startY;
                                                const dx = (dx_px / rect.width) * 100;
                                                const dy = (dy_px / rect.height) * 100;
                                                
                                                let { x, y, width, height } = initialRegion;
                                                
                                                // 1. Update raw dimensions based on direction
                                                if (dir.includes('e')) width += dx;
                                                if (dir.includes('w')) { x += dx; width -= dx; }
                                                if (dir.includes('s')) height += dy;
                                                if (dir.includes('n')) { y += dy; height -= dy; }
                                                
                                                // 2. Aspect Ratio Constraint
                                                if (cropAspect !== 'free') {
                                                     const aspectParts = cropAspect.split(':');
                                                     const visualRatio = parseFloat(aspectParts[0]) / parseFloat(aspectParts[1]);
                                                     const pxRatio = rect.height / rect.width; // scaling factor
                                                     const pctRatio = visualRatio * pxRatio; // W / H
                                                     
                                                     // Decide which dimension is master based on handle
                                                     // Corner handles: usually width dominant or logic to pick largest change?
                                                     // Keep simple: W controls H usually, unless N/S handle
                                                     
                                                     if (dir === 'n' || dir === 's') {
                                                         // Height master
                                                         const newWidth = height * pctRatio;
                                                         const wDiff = newWidth - width;
                                                         width = newWidth;
                                                         x -= wDiff / 2; // Center expansion
                                                     } else if (dir === 'e' || dir === 'w') {
                                                         // Width master
                                                         const newHeight = width / pctRatio;
                                                         const hDiff = newHeight - height;
                                                         height = newHeight;
                                                         y -= hDiff / 2;
                                                     } else {
                                                         // Corners
                                                         // If width change is larger relative, lock height
                                                         // Simplified: width master
                                                         if (Math.abs(dx) > Math.abs(dy)) {
                                                             const targetH = width / pctRatio;
                                                             if (dir.includes('n')) y += (height - targetH);
                                                             height = targetH;
                                                         } else {
                                                             const targetW = height * pctRatio;
                                                             if (dir.includes('w')) x += (width - targetW);
                                                             width = targetW;
                                                         }
                                                     }
                                                }
                                                
                                                // 3. Normalize constraints (min size, boundary)
                                                if (width < 0) {
                                                    // Flip? Too complex for now, just clamp min
                                                    width = 1; x = initialRegion.x; // naive fail-safe
                                                }
                                                if (height < 0) { height = 1; y = initialRegion.y; }

                                                // Boundary Clamp (Push back)
                                                // This is tricky with aspect ratio. 
                                                // Simplified: Just clamp hard limits.
                                                
                                                if (x < 0) x = 0;
                                                if (y < 0) y = 0;
                                                if (x + width > 100) width = 100 - x;
                                                if (y + height > 100) height = 100 - y;
                                                
                                                setCropRegion({ x, y, width, height });
                                            };
                                            
                                            const handleResizeUp = () => {
                                                 window.removeEventListener('mousemove', handleResize);
                                                 window.removeEventListener('mouseup', handleResizeUp);
                                            };
                                            
                                            window.addEventListener('mousemove', handleResize);
                                            window.addEventListener('mouseup', handleResizeUp);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
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
                    <button
                      className={styles.button}
                      onClick={togglePlay}
                      title="Play/Pause (Space)"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                      className={styles.button}
                      onClick={() => seekFrame("forward")}
                      title="Next Frame (Right Arrow)"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <button
                      className={styles.button}
                      onClick={() => setIsMuted(!isMuted)}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>

                  <div className={styles.timeDisplay}>
                    <span>
                      {Math.floor(currentTime / 60)}:
                      {(currentTime % 60).toFixed(2).padStart(5, "0")} /{" "}
                      {Math.floor(duration / 60)}:
                      {(duration % 60).toFixed(2).padStart(5, "0")}
                    </span>
                  </div>

                  <div className={styles.buttonGroup}>
                    <div className={styles.speedControl}>
                      <Settings size={14} />
                      <select
                        value={playbackSpeed}
                        onChange={(e) => {
                          const speed = parseFloat(e.target.value);
                          setPlaybackSpeed(speed);
                          if (videoRef.current) {
                            videoRef.current.playbackRate = speed;
                          }
                        }}
                        className={styles.speedSelect}
                      >
                        <option value={0.25}>0.25x</option>
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                    <button
                      className={`${styles.button} ${styles.captureButton}`}
                      onClick={captureFrame}
                      title="Capture Frame (X)"
                    >
                      <ImageIcon size={18} />
                      <span>Capture</span>
                    </button>
                    <button
                      className={`${styles.button} ${styles.saveButton}`}
                      onClick={saveFrame}
                      title="Save Frame to File"
                    >
                      <Save size={18} />
                      <span>Save Frame</span>
                    </button>
                  </div>
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
                        border: isZoomed ? '2px solid #00ff00' : 'none',
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
                Use <b>Arrow Keys</b> to scrub frame by frame. <b>Space</b> Play/Pause. <b>X</b> Capture frame.
              </p>
            </div>

            {/* Right Column */}
            <div className={styles.rightColumn}>
               {/* Video Info Card */}
               {videoMetadata && (
                  <div className={styles.infoCard}>
                    <div 
                        className={styles.infoCardHeader} 
                        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                        style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Info size={16} />
                            <span>Video Info</span>
                        </div>
                        {isInfoExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    {isInfoExpanded && (
                        <>
                            <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Resolution</span>
                            <span className={styles.infoValue}>{videoMetadata.width} x {videoMetadata.height}</span>
                            </div>
                            <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Duration</span>
                            <span className={styles.infoValue}>{formatTime(videoMetadata.duration)}</span>
                            </div>
                            <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Size</span>
                            <span className={styles.infoValue}>{formatFileSize(videoMetadata.fileSize)}</span>
                            </div>
                            <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Name</span>
                            <span className={styles.infoValue} title={videoMetadata.fileName}>
                                {videoMetadata.fileName.length > 20 
                                ? videoMetadata.fileName.substring(0, 17) + '...' 
                                : videoMetadata.fileName}
                            </span>
                            </div>
                        </>
                    )}
                  </div>
                )}

              {/* Captured Images Panel */}
              <div className={styles.capturedPanel}>
                <div className={styles.capturedHeader}>
                  <h3>
                    <ImageIcon size={16} />
                    Captured ({capturedImages.length})
                  </h3>
                  {capturedImages.length > 0 && (
                    <div className={styles.capturedActions}>
                      <button onClick={downloadAllImages} title="Download All">
                        <Download size={14} />
                      </button>
                      <button onClick={deleteAllImages} title="Delete All">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className={styles.capturedGrid}>
                  {capturedImages.length === 0 ? (
                    <p className={styles.emptyText}>Press <b>X</b> to capture frames</p>
                  ) : (
                    capturedImages.map((img) => (
                      <div key={img.id} className={styles.capturedItem}>
                        <img src={img.url} alt={`Captured at ${img.time.toFixed(2)}s`} />
                        <span className={styles.capturedTime}>{img.time.toFixed(2)}s</span>
                        <div className={styles.capturedItemActions}>
                          <button onClick={() => downloadImage(img)} title="Download">
                            <Download size={12} />
                          </button>
                          <button onClick={() => deleteImage(img.id)} title="Delete">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Review Mode */}
          {mode === 'review' && capturedImages.length > 0 && (
            <div className={styles.reviewPanel}>
              {/* Preview Area */}
              <div className={styles.previewArea}>
                {isSplitView ? (
                  <div className={styles.splitView}>
                    {/* Left Panel */}
                    <div
                      className={`${styles.splitPanel} ${focusedPanel === 'left' ? styles.focused : ''}`}
                      onClick={() => setFocusedPanel('left')}
                    >
                      {splitImages.left ? (() => {
                        const img = capturedImages.find((i) => i.id === splitImages.left);
                        return img ? (
                          <>
                            <img src={img.url} alt={`Left ${img.time.toFixed(2)}s`} />
                            <span className={styles.panelTime}>{img.time.toFixed(2)}s</span>
                          </>
                        ) : <p>Click to focus, then select image</p>;
                      })() : (
                        <div className={styles.emptyPanel}>
                          <ImageIcon size={32} />
                          <p>Click here, then select image</p>
                        </div>
                      )}
                      {focusedPanel === 'left' && <div className={styles.focusIndicator}>Active</div>}
                    </div>

                    {/* Right Panel */}
                    <div
                      className={`${styles.splitPanel} ${focusedPanel === 'right' ? styles.focused : ''}`}
                      onClick={() => setFocusedPanel('right')}
                    >
                      {splitImages.right ? (() => {
                        const img = capturedImages.find((i) => i.id === splitImages.right);
                        return img ? (
                          <>
                            <img src={img.url} alt={`Right ${img.time.toFixed(2)}s`} />
                            <span className={styles.panelTime}>{img.time.toFixed(2)}s</span>
                          </>
                        ) : <p>Click to focus, then select image</p>;
                      })() : (
                        <div className={styles.emptyPanel}>
                          <ImageIcon size={32} />
                          <p>Click here, then select image</p>
                        </div>
                      )}
                      {focusedPanel === 'right' && <div className={styles.focusIndicator}>Active</div>}
                    </div>
                  </div>
                ) : previewImageId ? (
                  <div className={styles.singlePreview}>
                    {(() => {
                      const img = capturedImages.find((i) => i.id === previewImageId);
                      return img ? (
                        <>
                          <img src={img.url} alt={`Preview ${img.time.toFixed(2)}s`} />
                          <span className={styles.previewTime}>{img.time.toFixed(2)}s</span>
                        </>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className={styles.noPreview}>
                    <ImageIcon size={48} />
                    <p>Click an image below to preview</p>
                  </div>
                )}
              </div>

              {/* Actions Bar */}
              <div className={styles.reviewActions}>
                <div className={styles.buttonGroup}>
                  <button 
                    className={`${styles.button} ${isSplitView ? styles.activeToggle : ''}`}
                    onClick={() => {
                      setIsSplitView(!isSplitView);
                      if (!isSplitView) {
                        setSplitImages({ left: null, right: null });
                        setFocusedPanel('left');
                      }
                    }}
                  >
                    {isSplitView ? 'Single View' : 'Split View'}
                  </button>
                  <button className={styles.button} onClick={downloadAllImages}>
                    <Download size={16} />
                    Download All ({capturedImages.length})
                  </button>
                  <button className={`${styles.button} ${styles.dangerButton}`} onClick={deleteAllImages}>
                    <Trash2 size={16} />
                    Delete All
                  </button>
                </div>
              </div>

              {/* Image Carousel */}
              <div className={styles.imageCarousel}>
                {capturedImages.map((img) => (
                  <div
                    key={img.id}
                    className={`${styles.carouselItem} ${previewImageId === img.id ? styles.previewing : ''} ${splitImages.left === img.id || splitImages.right === img.id ? styles.inSplit : ''}`}
                    onClick={() => {
                      if (isSplitView) {
                        setSplitImages((prev) => ({
                          ...prev,
                          [focusedPanel]: img.id,
                        }));
                      } else {
                        setPreviewImageId(img.id);
                      }
                    }}
                  >
                    <img src={img.url} alt={`${img.time.toFixed(2)}s`} />
                    <span>{img.time.toFixed(2)}s</span>
                    {(splitImages.left === img.id || splitImages.right === img.id) && (
                      <div className={styles.splitBadge}>
                        {splitImages.left === img.id ? 'L' : 'R'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
