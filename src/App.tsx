import { SiteFooter } from './components/layout/SiteFooter';
import { SiteHeader } from './components/layout/SiteHeader';
import { CertificatePage } from './pages/CertificatePage';

/** Single-page app: the certificate page is the whole site. Add a router here if more pages are needed. */
export function App() {
  return (
    <>
      <SiteHeader />
      <CertificatePage />
      <SiteFooter />
    </>
  );
}
