import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Poppins, Noto_Sans } from 'next/font/google'

// Load Google Fonts with optimization
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'], // you can adjust
  variable: '--font-poppins',
})

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-noto-sans',
})

export const metadata = {
  title: 'Global Gss Confession',
  description: 'Share your thoughts anonymously',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${poppins.variable} ${notoSans.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}


