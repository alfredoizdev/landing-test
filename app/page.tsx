import Image from "next/image";
import { contact, faqs, menuItems, reviews } from "./content";
import Hero from "./hero";

export default function Home() {
  return (
    <main>
      <Hero />

      <section id="menu" className="section" aria-labelledby="menu-title">
        <h2 id="menu-title">Menu</h2>
        <ul className="menu">
          {menuItems.map((item) => (
            <li key={item.name} className="menu-card">
              <Image
                src={item.image}
                alt={item.alt}
                width={500}
                height={333}
                sizes="(max-width: 40rem) 100vw, 30rem"
              />
              <div className="menu-card-body">
                <div className="menu-card-head">
                  <h3>{item.name}</h3>
                  <span className="price">{item.price}</span>
                </div>
                <div className="menu-card-more">
                  <p>{item.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="reviews" className="section" aria-labelledby="reviews-title">
        <h2 id="reviews-title">What our customers say</h2>
        <ul className="reviews">
          {reviews.map((review) => (
            <li key={review.name} className="review-card">
              <figure>
                <p className="stars" role="img" aria-label="5 out of 5 stars">
                  ★★★★★
                </p>
                <blockquote>{review.quote}</blockquote>
                <figcaption>{review.name}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <section id="faq" className="section" aria-labelledby="faq-title">
        <h2 id="faq-title">Frequently asked questions</h2>
        <ul className="faq">
          {faqs.map((item) => (
            <li key={item.question} className="faq-item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="contact" className="footer" aria-labelledby="contact-title">
        {/* Curved top edge: low on the left, rising to the right. It stretches
            with the screen width; its height is set in globals.css. */}
        <svg className="footer-curve" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,160 L0,132 C420,132 900,40 1440,0 L1440,160 Z" />
        </svg>
        <div className="footer-inner">
          <h2 id="contact-title">Contact</h2>
          <div className="contact">
            <div>
              <h3>Address</h3>
              <address>{contact.address}</address>
            </div>
            <div>
              <h3>Opening hours</h3>
              <p className="hours">{contact.hours}</p>
            </div>
            <div>
              <h3>Get in touch</h3>
              <p>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </p>
              <p>
                <a href={`tel:${contact.phone.replace(/[^\d]/g, "")}`}>{contact.phone}</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
