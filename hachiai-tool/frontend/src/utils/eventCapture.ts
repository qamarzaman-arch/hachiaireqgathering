export interface UserEvent {
  id: string;
  type: 'click' | 'keypress' | 'scroll' | 'navigation';
  timestamp: number;
  element?: {
    tagName: string;
    text: string;
    className: string;
    id: string;
    xpath?: string;
  };
  position?: { x: number; y: number };
  key?: string;
  url?: string;
  application: string;
  windowTitle: string;
}

export class EventCapture {
  private static instance: EventCapture;
  private listeners: (() => void)[] = [];
  private eventQueue: UserEvent[] = [];
  private lastEventTime = 0;
  private debounceTime = 100; // 100ms debounce

  static getInstance(): EventCapture {
    if (!EventCapture.instance) {
      EventCapture.instance = new EventCapture();
    }
    return EventCapture.instance;
  }

  startRecording(): void {
    this.setupEventListeners();
  }

  stopRecording(): void {
    this.removeEventListeners();
  }

  getEvents(): UserEvent[] {
    return [...this.eventQueue];
  }

  clearEvents(): void {
    this.eventQueue = [];
  }

  private setupEventListeners(): void {
    // Click events
    const clickHandler = (event: MouseEvent) => {
      this.recordClickEvent(event);
    };
    document.addEventListener('click', clickHandler, true);
    this.listeners.push(() => document.removeEventListener('click', clickHandler, true));

    // Keyboard events
    const keyHandler = (event: KeyboardEvent) => {
      this.recordKeyboardEvent(event);
    };
    document.addEventListener('keydown', keyHandler, true);
    this.listeners.push(() => document.removeEventListener('keydown', keyHandler, true));

    // Scroll events
    const scrollHandler = () => {
      this.recordScrollEvent();
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });
    this.listeners.push(() => window.removeEventListener('scroll', scrollHandler));

    // Navigation events
    const navigationHandler = () => {
      this.recordNavigationEvent();
    };
    window.addEventListener('popstate', navigationHandler);
    this.listeners.push(() => window.removeEventListener('popstate', navigationHandler));
  }

  private removeEventListeners(): void {
    this.listeners.forEach(remove => remove());
    this.listeners = [];
  }

  private shouldRecordEvent(): boolean {
    const now = Date.now();
    if (now - this.lastEventTime < this.debounceTime) {
      return false;
    }
    this.lastEventTime = now;
    return true;
  }

  private recordClickEvent(event: MouseEvent): void {
    if (!this.shouldRecordEvent()) return;

    const target = event.target as HTMLElement;
    const userEvent: UserEvent = {
      id: Date.now().toString(),
      type: 'click',
      timestamp: Date.now(),
      position: { x: event.clientX, y: event.clientY },
      element: this.getElementInfo(target),
      application: this.detectApplication(),
      windowTitle: document.title
    };

    this.eventQueue.push(userEvent);
  }

  private recordKeyboardEvent(event: KeyboardEvent): void {
    // Only record special keys or ignore sensitive input
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey) return;

    const userEvent: UserEvent = {
      id: Date.now().toString(),
      type: 'keypress',
      timestamp: Date.now(),
      key: this.maskSensitiveKey(event.key),
      application: this.detectApplication(),
      windowTitle: document.title
    };

    this.eventQueue.push(userEvent);
  }

  private recordScrollEvent(): void {
    if (!this.shouldRecordEvent()) return;

    const userEvent: UserEvent = {
      id: Date.now().toString(),
      type: 'scroll',
      timestamp: Date.now(),
      application: this.detectApplication(),
      windowTitle: document.title
    };

    this.eventQueue.push(userEvent);
  }

  private recordNavigationEvent(): void {
    const userEvent: UserEvent = {
      id: Date.now().toString(),
      type: 'navigation',
      timestamp: Date.now(),
      url: window.location.href,
      application: this.detectApplication(),
      windowTitle: document.title
    };

    this.eventQueue.push(userEvent);
  }

  private getElementInfo(element: HTMLElement): UserEvent['element'] {
    const text = element.textContent?.slice(0, 50) || '';
    const isSensitive = this.isSensitiveElement(element);
    
    return {
      tagName: element.tagName.toLowerCase(),
      text: isSensitive ? this.maskSensitiveText(text) : text,
      className: element.className,
      id: element.id,
      xpath: this.generateXPath(element)
    };
  }

  private isSensitiveElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const type = (element as HTMLInputElement).type?.toLowerCase();
    const className = element.className.toLowerCase();
    
    // Check for password fields
    if (tagName === 'input' && type === 'password') return true;
    
    // Check for email fields
    if (tagName === 'input' && type === 'email') return true;
    
    // Check for sensitive class names
    const sensitiveClasses = ['password', 'secret', 'token', 'key', 'ssn', 'credit-card'];
    if (sensitiveClasses.some(cls => className.includes(cls))) return true;
    
    // Check for credit card patterns
    const text = element.textContent || '';
    if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) return true;
    
    return false;
  }

  private maskSensitiveText(text: string): string {
    if (text.length <= 4) return '****';
    return text.slice(0, 2) + '***' + text.slice(-1);
  }

  private maskSensitiveKey(key: string): string {
    const sensitiveKeys = ['password', 'email', 'ssn', 'credit'];
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      return '***';
    }
    return key;
  }

  private generateXPath(element: HTMLElement): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    const parts: string[] = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;
      
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }
      
      const tagName = current.nodeName.toLowerCase();
      const pathIndex = index > 0 ? `[${index + 1}]` : '';
      parts.unshift(`${tagName}${pathIndex}`);
      
      current = current.parentElement!;
    }
    
    return '/' + parts.join('/');
  }

  private detectApplication(): string {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // Detect common web applications
    if (hostname.includes('google.com')) return 'Google';
    if (hostname.includes('microsoft.com') || hostname.includes('office.com')) return 'Microsoft Office';
    if (hostname.includes('github.com')) return 'GitHub';
    if (hostname.includes('slack.com')) return 'Slack';
    if (hostname.includes('notion.so')) return 'Notion';
    
    // Detect based on URL patterns
    if (pathname.includes('/admin')) return 'Admin Panel';
    if (pathname.includes('/dashboard')) return 'Dashboard';
    
    // Default to hostname
    return hostname || 'Web Application';
  }
}
