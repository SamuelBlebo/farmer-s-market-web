/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets `next dev` be reached from a phone on the same network (e.g. to
  // test camera/mic permissions, which need a real device) without the
  // cross-origin warning. Dev-only — has no effect on the production build.
  allowedDevOrigins: ['172.20.10.4'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
    // Only ever serves our own hand-authored files in public/seed — never
    // farmer-uploaded content, which always goes through Cloudinary above.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};
export default nextConfig;
