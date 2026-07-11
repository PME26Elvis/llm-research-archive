export interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

export interface CopyTextOptions {
  clipboard?: ClipboardWriter;
  fallback?: (text: string) => boolean;
}

function browserClipboard(): ClipboardWriter | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.clipboard;
}

export function legacyCopyText(text: string): boolean {
  const activeElement = document.activeElement as HTMLElement | null;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.readOnly = true;
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.inset = '0 auto auto -9999px';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    textarea.remove();
    activeElement?.focus();
  }
}

export async function copyText(text: string, options: CopyTextOptions = {}): Promise<boolean> {
  const clipboard = options.clipboard ?? browserClipboard();
  if (clipboard) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Packaged file:// renderers can reject Clipboard API access. Use the user-gesture fallback.
    }
  }

  try {
    return (options.fallback ?? legacyCopyText)(text);
  } catch {
    return false;
  }
}
