import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, 
  Heading1, Heading2, Highlighter, Eraser, Image as ImageIcon
} from 'lucide-react';

interface VisualEditorProps {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export const VisualEditor = ({ content, onChange, disabled }: VisualEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !disabled,
  });

  if (!editor) return null;

  const ToolbarButton = ({ onClick, active, children, title }: any) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`h-8 w-8 p-0 ${active ? 'bg-[#EFE6D6] text-[#1A1A1A]' : 'text-[#1A1A1A]/60'}`}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-[#1A1A1A]/10 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-[#1A1A1A]/10 bg-[#FDFBF7]">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        
        <div className="w-px h-4 bg-[#1A1A1A]/10 mx-1" />
        
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
          active={editor.isActive('heading', { level: 1 })}
          title="H1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          active={editor.isActive('heading', { level: 2 })}
          title="H2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        
        <div className="w-px h-4 bg-[#1A1A1A]/10 mx-1" />

        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-4 bg-[#1A1A1A]/10 mx-1" />

        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('left').run()} 
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('center').run()} 
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('right').run()} 
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-4 bg-[#1A1A1A]/10 mx-1" />

        <ToolbarButton 
          onClick={() => {
            const url = window.prompt('URL');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }} 
          active={editor.isActive('link')}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHighlight().run()} 
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
        >
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none"
      />
    </div>
  );
};