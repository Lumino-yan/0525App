import Header from '../sections/Header';
import Hero from '../sections/Hero';
import WhyChoose from '../sections/WhyChoose';
import ProjectSpace from '../sections/ProjectSpace';
import ManagementConsole from '../sections/ManagementConsole';
import Footer from '../sections/Footer';

export default function Home() {
  return (
    <div className="relative">
      <Header />
      <main>
        <Hero />
        <WhyChoose />
        <ProjectSpace />
        <ManagementConsole />
      </main>
      <Footer />
    </div>
  );
}
