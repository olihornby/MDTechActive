import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';

function HomePage() {
  return (
    <div className="d-flex flex-column min-vh-100 app-shell">
      <Navbar />

      <main className="container py-5 flex-grow-1">
        <section className="mb-4">
          <h1 className="display-6 fw-bold">MERN + Bootstrap Starter</h1>
          <p className="lead text-secondary mb-0">
            This page is a foundation for building your project features.
          </p>
        </section>

        <section className="row g-3">
          <div className="col-12 col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <h2 className="h5">Client</h2>
                <p className="text-secondary mb-0">React UI powered by Bootstrap styles.</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <h2 className="h5">Server</h2>
                <p className="text-secondary mb-0">Express API with a clean route/controller split.</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <h2 className="h5">Database</h2>
                <p className="text-secondary mb-0">Mongoose-ready configuration for MongoDB integration.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 d-flex gap-2 flex-wrap">
          <button type="button" className="btn btn-primary">Primary Action</button>
          <button type="button" className="btn btn-outline-secondary">Secondary Action</button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
