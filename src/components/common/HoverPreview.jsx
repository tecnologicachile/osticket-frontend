import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'

export default function HoverPreview({ content, html, children }) {
  if (!content && !html) return children

  return (
    <Tippy
      content={
        html ? (
          <div
            className='max-w-sm max-h-64 overflow-y-auto text-sm leading-relaxed prose prose-sm dark:prose-invert [--tw-prose-body:#111827] dark:[--tw-prose-body:#f3f4f6]'
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className='max-w-sm max-h-64 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap break-words'>
            {content}
          </div>
        )
      }
      delay={[300, 100]}
      placement='bottom-start'
      interactive
      appendTo={() => document.body}
      maxWidth={400}
      arrow
    >
      <span className='cursor-help'>{children}</span>
    </Tippy>
  )
}
