import './globals.css'

export const metadata = {
  title: 'Anonymous Confessions',
  description: 'Share your thoughts anonymously',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}