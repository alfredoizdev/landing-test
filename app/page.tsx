import { contact, menuItems, shop } from "./content";

export default function Home() {
  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <nav aria-label="Page sections">
          <a href="#menu">Menu</a>
          <a href="#contact">Contact</a>
        </nav>
        <h1 id="hero-title">{shop.name}</h1>
        <p className="welcome">{shop.welcome}</p>
        <a className="cta" href="#menu">
          See the menu
        </a>
      </section>

      <section id="menu" className="section" aria-labelledby="menu-title">
        <h2 id="menu-title">Menu</h2>
        <ul className="menu">
          {menuItems.map((item) => (
            <li key={item.name}>
              <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
              <span className="price">{item.price}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="contact" className="section" aria-labelledby="contact-title">
        <h2 id="contact-title">Contact</h2>
        <div className="contact">
          <div>
            <h3>Address</h3>
            <address>{contact.address}</address>
          </div>
          <div>
            <h3>Opening hours</h3>
            <ul className="hours">
              {contact.hours.map((slot) => (
                <li key={slot.days}>
                  {slot.days}: {slot.time}
                </li>
              ))}
            </ul>
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
      </section>
    </main>
  );
}
