import { Paperclip, X } from 'lucide-react'

export default function AttachmentList({ files, onRemove, onAdd }) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <label className='inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors'>
          <Paperclip className='w-3.5 h-3.5' />
          Adjuntar archivo
          <input type='file' multiple className='hidden' onChange={(e) => {
            if (e.target.files?.length) {
              const newFiles = Array.from(e.target.files)
              onAdd?.(newFiles)
              e.target.value = ''
            }
          }} />
        </label>
        {files.length > 0 && (
          <span className='text-xs text-gray-400'>{files.length} archivo(s)</span>
        )}
      </div>
      {files.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {files.map((file, i) => (
            <div key={i} className='inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs border border-gray-200 dark:border-gray-700'>
              <Paperclip className='w-3 h-3 text-gray-400' />
              <span className='text-gray-700 dark:text-gray-300 truncate max-w-[150px]'>{file.name}</span>
              <span className='text-gray-400'>{(file.size / 1024).toFixed(0)} KB</span>
              <button
                onClick={() => onRemove(i)}
                className='p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
              >
                <X className='w-3 h-3' />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
