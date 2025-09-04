# ContextMenu

## 🏃 Quick Start

```javascript
import ContextMenu from 'contextmenu';

// Create a context menu that opens on right-click anywhere
const menu = new ContextMenu({
  activation: 'contextmenu',
  mode: 'always'
});

// Add some actions
menu
  .action('Cut', () => document.execCommand('cut'))
  .action('Copy', () => document.execCommand('copy'))
  .action('Paste', () => document.execCommand('paste'))
  .sep()
  .action('Select All', () => document.execCommand('selectAll'));
```

## 📖 Usage Guide

### Instantiation

#### Open on right-click anywhere in the page

```javascript
const menu = new ContextMenu({
  activation: 'contextmenu',
  mode: 'always'
});
```

#### Open only when right-clicking specific elements

```javascript
const menu = new ContextMenu({
  activation: 'contextmenu',
  mode: 'selector',
  selector: '[data-menu="context-menu"]',
});
```

### Modes Explained

#### `mode: 'always'`

The menu opens for ANY activation event inside the container (default: `document`).

- `ctx.target` is the original event target
- Useful for global context menus

#### `mode: 'selector'`

The menu opens ONLY if `event.target.closest(selector)` returns an element.

- `ctx.target` is the matched element (not just the child you clicked)
- Use `context_fn(event, matchedElement)` to pass domain-specific data
- Perfect for item-specific menus

### Multiple Triggers

```javascript
const menu = new ContextMenu({
  activation: ['contextmenu', 'click'], // Multiple trigger events
  mode: 'selector',
  selector: '.menu-item'
});
```

## 🔧 Building Menus

### Fluent API

```javascript
fileMenu
  .action('Open', ({data}) => openFile(data.id))
  .action('Rename', ({data}) => renameFile(data.id))
  .sep()
  .check('Pinned',
    ({data}) => isPinned(data.id),              // Initial state
    (checked, {data}) => setPinned(data.id, checked)  // Toggle handler
  );
```

### Action Options

```javascript
fileMenu.action('Delete', ({data}) => deleteFile(data.id), {
  visible: ({data}) => data.type !== 'folder',    // Hide item if false
  enabled: ({data}) => !isProtected(data.id),     // Disable if false
  icon_html: '🗑️',                                // Optional icon HTML
  danger: true                                    // Red-ish hover style
});
```

### Context Object

Every handler receives a context object with:

```javascript
{
  event,            // Original DOM event
  target,           // Matched element (selector mode) or event target (always mode)
  data,             // Shorthand for target.dataset
  ...context_fn()   // Any extra fields you injected via context_fn
}
```

## 🎯 Advanced Usage

### Manual Triggering

```javascript
// Open at specific coordinates
button.addEventListener('click', (e) => {
  const ctx = { from: 'button', id: button.dataset.id };
  fileMenu.open_at(e.clientX, e.clientY, ctx);
});

// Handle events directly
container.addEventListener('contextmenu', (e) => {
  fileMenu.open_for_event(e);
});
```

### Mobile Long-Press Support

```javascript
function longPress(element, callback, duration = 500) {
  let timeout = null;
  
  element.addEventListener('touchstart', (e) => {
    timeout = setTimeout(() => callback(e.touches[0]), duration);
  }, { passive: true });
  
  ['touchend', 'touchmove', 'touchcancel'].forEach(eventType => {
    element.addEventListener(eventType, () => {
      clearTimeout(timeout);
    }, { passive: true });
  });
}

// Apply long-press to open context menu
longPress(document, (touch) => {
  fileMenu.open_at(touch.clientX, touch.clientY, { from: 'touch' });
});
```

### Dynamic Menu Updates

```javascript
// Replace all items
fileMenu.set_items([]);

// Rebuild menu
fileMenu
  .action('Refresh', () => location.reload())
  .sep()
  .action('About', () => showAbout());

// Control visibility
fileMenu.close();    // Hide if open
fileMenu.destroy();  // Remove DOM and event listeners
```

## 📝 API Reference

### Constructor Options

```typescript
interface ContextMenuOptions {
  activation?: string | string[];           // 'contextmenu' | 'click' | etc.
  mode?: 'always' | 'selector';           // Targeting mode
  selector?: string;                       // CSS selector (required for 'selector' mode)
  container?: Document | HTMLElement;      // Event container (default: document)
  items?: MenuItem[];                      // Initial menu items
  context_fn?: (event: Event, target: Element | null) => object;
}
```

### Fluent API Methods

| Method | Description |
|--------|-------------|
| `action(label, onClick, options?)` | Add an action item |
| `check(label, getChecked, onToggle, options?)` | Add a checkbox item |
| `sep()` | Add a separator |
| `set_items(items[])` | Replace all menu items |
| `open_for_event(event)` | Open menu for a specific event |
| `open_at(x, y, context?)` | Open menu at coordinates |
| `close()` | Close the menu if open |
| `destroy()` | Remove menu and cleanup |

### Item Options

```typescript
interface ItemOptions {
  visible?: (context) => boolean;    // Show/hide condition
  enabled?: (context) => boolean;    // Enable/disable condition
  icon_html?: string;                // HTML for icon (SVG, emoji, etc.)
  danger?: boolean;                  // Apply danger styling
}
```

## 🎨 Styling

The context menu uses CSS classes that you can customize:

```css
.context-menu {
  /* Menu container */
}

.context-menu-item {
  /* Menu item */
}

.context-menu-item.danger {
  /* Danger item styling */
}

.context-menu-item.disabled {
  /* Disabled item styling */
}

.context-menu-separator {
  /* Separator styling */
}
```

## 🌟 Examples

### File Manager Context Menu

```javascript
const fileMenu = new ContextMenu({
  activation: 'contextmenu',
  mode: 'selector',
  selector: '.file-item',
  context_fn: (e, el) => ({
    id: el.dataset.fileId,
    type: el.dataset.fileType,
    name: el.dataset.fileName
  })
});

fileMenu
  .action('Open', ({data}) => openFile(data.id))
  .action('Download', ({data}) => downloadFile(data.id))
  .sep()
  .action('Rename', ({data}) => renameFile(data.id))
  .action('Move', ({data}) => moveFile(data.id))
  .sep()
  .check('Starred', 
    ({data}) => isStarred(data.id),
    (starred, {data}) => setStarred(data.id, starred)
  )
  .sep()
  .action('Delete', ({data}) => deleteFile(data.id), {
    icon_html: '🗑️',
    danger: true,
    enabled: ({data}) => data.type !== 'system'
  });
```

### Text Editor Context Menu

```javascript
const editorMenu = new ContextMenu({
  activation: 'contextmenu',
  mode: 'always',
  container: document.querySelector('.editor')
});

editorMenu
  .action('Cut', () => document.execCommand('cut'), {
    enabled: () => !document.getSelection().isCollapsed
  })
  .action('Copy', () => document.execCommand('copy'), {
    enabled: () => !document.getSelection().isCollapsed
  })
  .action('Paste', () => document.execCommand('paste'))
  .sep()
  .action('Select All', () => document.execCommand('selectAll'))
  .sep()
  .action('Find...', () => showFindDialog(), {
    icon_html: '🔍'
  });
```

# EditableText

## 🚀 Quick Start

```javascript
const nameField = new EditableText({
  value: 'My Document',
  tag: 'h2',
  on_save: (value, instance) => saveFileName(fileId, value)
});

// Direct insertion into template strings
document.querySelector('.header').innerHTML = `
  ${source}
  ${nameField}
`;
```

## 📦 Installation

```bash
npm install editable-text
```

## 🎯 User Interaction

- **Double-click** to enter edit mode (focus + select all)
- **Enter** or **blur** to save (calls `on_save`)
- **Escape** to cancel (calls `on_cancel`)
- Empty or unchanged values are ignored and revert

## 🔧 API

### Constructor

```javascript
new EditableText({
  value: string,                    // Initial content
  tag?: string,                     // 'h1'|'h2'|'h3'|'h4'|'h5'|'h6'|'span'|'div' (default: 'h2')
  id?: string,                      // Auto-generated if not provided
  on_save?: (value, instance) => void|Promise,
  on_cancel?: (instance) => void
})
```

### HTML Output

`String(instance)` returns complete HTML ready for template insertion:

```html

  Content

```

## 📖 Examples

### Basic Usage

```javascript
const titleField = new EditableText({
  value: document.title,
  tag: 'h1',
  on_save: async (newTitle) => {
    await fetch('/api/title', { 
      method: 'POST', 
      body: JSON.stringify({ title: newTitle }) 
    });
  }
});
```

### Error Handling

```javascript
const field = new EditableText({
  value: 'filename.txt',
  on_save: async (value) => {
    if (!isValidFileName(value)) {
      throw new Error('Invalid filename'); // Triggers automatic revert
    }
    await saveFile(value);
  }
});
```

### Multiple Instances

```javascript
const contact = {
  name: new EditableText({ value: 'John Doe', tag: 'h3' }),
  title: new EditableText({ value: 'Developer', tag: 'span' })
};

element.innerHTML = `
  ${contact.name}
  ${contact.title}
`;
```

## 🎨 CSS Classes

```css
.editable-text              /* Container */
.editable-text .view        /* Display mode */
.editable-text .edit        /* Input mode */
.editable-text.is-editing   /* Container when editing */
```


## 🔧 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

---

⭐ If this library helped you, please consider giving it a star!