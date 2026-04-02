import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownRenderer({ content }) {
  return (
    <article className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:text-text-primary prose-h1:text-2xl prose-h2:text-xl prose-p:text-text-secondary prose-p:leading-relaxed prose-a:text-brand-400 prose-strong:text-text-primary prose-li:text-text-secondary prose-img:rounded-xl prose-img:shadow-lg prose-hr:border-border">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt, ...props }) => {
            const resolvedSrc = src?.startsWith('http')
              ? src
              : `/journals/${src?.replace(/^\.\//, '')}`
            return (
              <img
                src={resolvedSrc}
                alt={alt}
                className="rounded-xl shadow-lg max-w-full"
                loading="lazy"
                {...props}
              />
            )
          },
          hr: () => (
            <hr className="my-8 border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
