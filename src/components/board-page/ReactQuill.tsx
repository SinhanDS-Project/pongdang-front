'use client'

import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

type Props = {
  value: string
  onChange: (value: string) => void
  height?: number
}

export default function ReactQuillEditor({ value, onChange, height = 400 }: Props) {
  const formats = [
    'size',
    'color',
    'background',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'indent',
    'image',
  ]

  const modules = {
    toolbar: {
      container: [
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ color: [] }, { background: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['image'],
      ],
    },
  }

  return (
    <div className="quill-wrap overflow-hidden rounded-xl border border-gray-200" style={{ height }}>
      <ReactQuill
        theme="snow"
        value={value}
        formats={formats}
        modules={modules}
        onChange={onChange}
        style={{ height: '100%' }}
      />
      <style jsx global>{`
        .quill-wrap .ql-container {
          height: calc(100% - 42px);
        }
        .quill-wrap .ql-editor {
          height: 100%;
          overflow-y: auto;
        }
      `}</style>
    </div>
  )
}
