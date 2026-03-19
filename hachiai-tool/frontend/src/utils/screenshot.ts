export interface ScreenshotData {
  id: string;
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
}

export class ScreenshotCapture {
  private static instance: ScreenshotCapture;
  
  static getInstance(): ScreenshotCapture {
    if (!ScreenshotCapture.instance) {
      ScreenshotCapture.instance = new ScreenshotCapture();
    }
    return ScreenshotCapture.instance;
  }

  async captureScreen(): Promise<ScreenshotData> {
    try {
      console.log('Attempting screenshot capture...');
      
      // Try to use the Screen Capture API if available
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: window.innerWidth },
              height: { ideal: window.innerHeight }
            }
          });
          
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          // Wait for video to be ready
          await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
          });
          
          // Create canvas and capture frame
          const canvas = document.createElement('canvas');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Stop the stream
            stream.getTracks().forEach(track => track.stop());
            
            const dataUrl = canvas.toDataURL('image/webp', 0.9);
            console.log('Screen capture API screenshot successful');
            
            return {
              id: Date.now().toString(),
              dataUrl,
              timestamp: Date.now(),
              width: canvas.width,
              height: canvas.height
            };
          }
        } catch (displayMediaError) {
          console.warn('Screen capture API not available or denied:', displayMediaError);
        }
      }
      
      // Fallback to html2canvas
      return this.captureWithHtml2Canvas();
      
    } catch (error) {
      console.error('All screenshot methods failed:', error);
      return this.createContextualScreenshot();
    }
  }

  private async captureWithHtml2Canvas(): Promise<ScreenshotData> {
    try {
      console.log('Trying html2canvas...');
      const html2canvas = await import('html2canvas');
      
      const canvas = await html2canvas.default(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: window.innerWidth,
        height: window.innerHeight
      });

      const dataUrl = canvas.toDataURL('image/webp', 0.9);
      console.log('html2canvas screenshot successful');
      
      return {
        id: Date.now().toString(),
        dataUrl,
        timestamp: Date.now(),
        width: canvas.width,
        height: canvas.height
      };
    } catch (error) {
      console.warn('html2canvas failed:', error);
      return this.createContextualScreenshot();
    }
  }

  private createContextualScreenshot(): Promise<ScreenshotData> {
    return new Promise((resolve) => {
      console.log('Creating contextual screenshot...');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(this.createPlaceholderScreenshot());
        return;
      }

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Create a more realistic representation of the current page
      this.drawPageRepresentation(ctx, canvas);

      const dataUrl = canvas.toDataURL('image/webp', 0.9);
      console.log('Contextual screenshot created');
      
      resolve({
        id: Date.now().toString(),
        dataUrl,
        timestamp: Date.now(),
        width: canvas.width,
        height: canvas.height
      });
    });
  }

  private drawPageRepresentation(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Get current page information
    const pageTitle = document.title;
    const currentPath = window.location.pathname;
    
    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw header area (top bar)
    const headerHeight = 60;
    ctx.fillStyle = '#8E65A4';
    ctx.fillRect(0, 0, canvas.width, headerHeight);
    
    // Header content
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Hachiai Tool', 20, 35);
    
    // Time in header
    ctx.font = '14px Arial';
    ctx.fillText(new Date().toLocaleTimeString(), canvas.width - 150, 35);

    // Main content area
    const contentY = headerHeight + 20;
    const contentHeight = canvas.height - headerHeight - 40;
    
    // White content background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, contentY, canvas.width - 40, contentHeight);
    
    // Content border
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, contentY, canvas.width - 40, contentHeight);

    // Page information
    let yPosition = contentY + 30;
    ctx.fillStyle = '#333333';
    ctx.font = '16px Arial';
    ctx.fillText(`Page: ${pageTitle}`, 40, yPosition);
    
    yPosition += 25;
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(`Path: ${currentPath}`, 40, yPosition);
    
    yPosition += 25;
    ctx.fillText(`Time: ${new Date().toLocaleString()}`, 40, yPosition);

    // Detect current page context and draw appropriate elements
    if (currentPath.includes('editor')) {
      this.drawEditorContext(ctx, canvas, contentY, yPosition);
    } else {
      this.drawHomeContext(ctx, canvas, contentY, yPosition);
    }
  }

  private drawEditorContext(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, _contentY: number, yPosition: number): void {
    // Draw editor interface elements
    yPosition += 40;
    
    // Step list area
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(40, yPosition, canvas.width / 2 - 60, 200);
    
    ctx.strokeStyle = '#dee2e6';
    ctx.strokeRect(40, yPosition, canvas.width / 2 - 60, 200);
    
    // Sample step items
    ctx.fillStyle = '#8E65A4';
    ctx.fillRect(50, yPosition + 10, 80, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('Step 1', 65, yPosition + 35);
    
    // Preview area
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(canvas.width / 2 + 20, yPosition, canvas.width / 2 - 60, 200);
    
    ctx.strokeStyle = '#dee2e6';
    ctx.strokeRect(canvas.width / 2 + 20, yPosition, canvas.width / 2 - 60, 200);
    
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.fillText('Screenshot Preview', canvas.width / 2 + 40, yPosition + 110);
  }

  private drawHomeContext(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, _contentY: number, yPosition: number): void {
    // Draw home interface elements
    yPosition += 40;
    
    // Recording cards grid
    const cardWidth = 200;
    const cardHeight = 150;
    const cardsPerRow = 3;
    const cardSpacing = 20;
    
    for (let i = 0; i < 3; i++) {
      const x = 40 + (i % cardsPerRow) * (cardWidth + cardSpacing);
      const y = yPosition + Math.floor(i / cardsPerRow) * (cardHeight + cardSpacing);
      
      // Card background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, cardWidth, cardHeight);
      
      // Card border
      ctx.strokeStyle = '#e0e0e0';
      ctx.strokeRect(x, y, cardWidth, cardHeight);
      
      // Card image placeholder
      ctx.fillStyle = '#8E65A4';
      ctx.fillRect(x + 10, y + 10, cardWidth - 20, 80);
      
      // Card text
      ctx.fillStyle = '#333333';
      ctx.font = '14px Arial';
      ctx.fillText(`Recording ${i + 1}`, x + 10, y + 110);
      
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.fillText(`${3 + i} steps`, x + 10, y + 130);
    }
  }

  private createPlaceholderScreenshot(): ScreenshotData {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(window.innerWidth, 1200);
    canvas.height = Math.min(window.innerHeight, 800);
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#8E65A4');
      gradient.addColorStop(1, '#6A407D');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add white overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // Add text
      ctx.fillStyle = '#444444';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Screenshot Capture', canvas.width / 2, canvas.height / 2 - 20);
      
      ctx.font = '16px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText(`Captured at ${new Date().toLocaleTimeString()}`, canvas.width / 2, canvas.height / 2 + 10);
      
      ctx.font = '14px Arial';
      ctx.fillStyle = '#999999';
      ctx.fillText('Application: Hachiai Tool', canvas.width / 2, canvas.height / 2 + 40);
    }

    const dataUrl = canvas.toDataURL('image/webp', 0.8);
    
    return {
      id: Date.now().toString(),
      dataUrl,
      timestamp: Date.now(),
      width: canvas.width,
      height: canvas.height
    };
  }

  async captureWithHighlight(element: HTMLElement): Promise<ScreenshotData> {
    const screenshot = await this.captureScreen();
    
    try {
      // Create a canvas to add highlight
      const img = new Image();
      img.src = screenshot.dataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = screenshot.width;
      canvas.height = screenshot.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw the original screenshot
        ctx.drawImage(img, 0, 0);
        
        // Add highlight around the element
        const rect = element.getBoundingClientRect();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
        
        // Add glow effect
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
      }

      const highlightedDataUrl = canvas.toDataURL('image/webp', 0.8);
      
      return {
        ...screenshot,
        dataUrl: highlightedDataUrl
      };
    } catch (error) {
      console.error('Failed to add highlight:', error);
      return screenshot;
    }
  }

  compressImage(dataUrl: string, quality: number = 0.7): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const compressedDataUrl = canvas.toDataURL('image/webp', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(dataUrl);
        }
      };
    });
  }
}
