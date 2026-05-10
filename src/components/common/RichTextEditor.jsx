import React, { useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Link as LinkIcon, List, ListOrdered, Quote, Code,
  Image as ImageIcon, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Highlighter, Palette
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef(null);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        editor.chain().focus().setImage({ src: event.target.result }).run();
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const ToolbarButton = ({ onClick, isActive, disabled, children, title }) => (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className='border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 sticky top-0 z-10 flex flex-wrap gap-1 items-center rounded-t-md'>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title='Bold'
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title='Italic'
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title='Underline'
      >
        <UnderlineIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title='Strike'
      >
        <Strikethrough size={16} />
      </ToolbarButton>

      <div className='w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1' />

      {showLinkInput ? (
        <div className='flex items-center gap-1'>
          <input
            type='url'
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder='URL...'
            className='px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none'
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              } else if (e.key === 'Escape') {
                setShowLinkInput(false);
              }
            }}
          />
          <button type='button' onClick={addLink} className='text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600'>OK</button>
          <button type='button' onClick={() => setShowLinkInput(false)} className='text-xs px-2 py-1 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500'>X</button>
        </div>
      ) : (
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              setShowLinkInput(true);
            }
          }}
          isActive={editor.isActive('link')}
          title='Link'
        >
          <LinkIcon size={16} />
        </ToolbarButton>
      )}

      <div className='w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1' />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title='Bullet List'
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title='Ordered List'
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title='Blockquote'
      >
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title='Code Block'
      >
        <Code size={16} />
      </ToolbarButton>

      <div className='w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1' />

      <input
        type='file'
        accept='image/*'
        ref={fileInputRef}
        onChange={handleImageUpload}
        className='hidden'
      />
      <ToolbarButton
        onClick={() => fileInputRef.current?.click()}
        title='Image'
      >
        <ImageIcon size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={insertTable}
        title='Table'
      >
        <TableIcon size={16} />
      </ToolbarButton>

      <div className='w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1' />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title='Align Left'
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title='Align Center'
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title='Align Right'
      >
        <AlignRight size={16} />
      </ToolbarButton>

      <div className='w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1' />

      <div className='relative group flex items-center'>
        <ToolbarButton title='Text Color'>
          <Palette size={16} />
        </ToolbarButton>
        <input
          type='color'
          onInput={(event) => editor.chain().focus().setColor(event.target.value).run()}
          value={editor.getAttributes('textStyle').color || '#000000'}
          className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
          title='Text Color'
        />
      </div>

      <div className='relative group flex items-center'>
        <ToolbarButton title='Highlight' isActive={editor.isActive('highlight')}>
          <Highlighter size={16} />
        </ToolbarButton>
        <input
          type='color'
          onInput={(event) => editor.chain().focus().toggleHighlight({ color: event.target.value }).run()}
          className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
          title='Highlight Color'
        />
      </div>

      <div className='w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1' />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title='Undo'
      >
        <Undo size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title='Redo'
      >
        <Redo size={16} />
      </ToolbarButton>
    </div>
  );
};

const RichTextEditor = ({ content, onChange, placeholder = 'Escribe aquí...' }) => {
  const handlePaste = useCallback((view, event, slice) => {
    const items = event.clipboardData?.items;
    if (!items) return false;

    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result;
            if (src) {
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            }
          };
          reader.readAsDataURL(file);
        }
        return true;
      }
    }
    return false;
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md my-2',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full border border-gray-300 dark:border-gray-600 my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-2 font-bold text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-600 p-2',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none min-h-[200px] p-4 focus:outline-none',
      },
      handlePaste,
    },
  });

  // Update content if it changes from outside
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Only update if the content is actually different to avoid cursor jumping
      // This is a simple check, for a more robust one, we might need to compare text or use a different approach
      // But usually, we only set content initially or when clearing the form
      if (content === '' || content === '<p></p>') {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  return (
    <div className='border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-900 flex flex-col'>
      <MenuBar editor={editor} />
      <div className='flex-1 overflow-y-auto'>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
