import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  const events = [
    { num: "01", name: "Tech Quest", cat: "ARENA", classes: "III-IV" },
    { num: "02", name: "Scratch-N-Win", cat: "CODE", classes: "III-V" },
    { num: "03", name: "Jersey Journal", cat: "CREATE", classes: "IV-VII" },
    { num: "04", name: "Pixel Press", cat: "CREATE", classes: "V-VII" },
    { num: "05", name: "Ctrl+LOL", cat: "CYBER", classes: "VIII-X" },
    { num: "06", name: "AI Versus Reality", cat: "ARENA", classes: "VIII-IX" },
    { num: "07", name: "NISAR's Space Odyssey", cat: "CREATE", classes: "VI-VIII" },
    { num: "08", name: "Virtual Heist", cat: "CYBER", classes: "VIII-X" },
    { num: "09", name: "Build, Defend & Destroy", cat: "ARENA", classes: "VIII-XII" },
    { num: "10", name: "Electric Avenue", cat: "CREATE", classes: "VIII-XII" },
    { num: "11", name: "Techpreneurs of Tomorrow", cat: "ARENA", classes: "IX-XII" },
    { num: "12", name: "Austen Anew", cat: "CREATE", classes: "IX-XII" },
    { num: "13", name: "NextGen Intellects", cat: "CODE", classes: "IX-XII" },
    { num: "14", name: "Frame by Frame", cat: "CREATE", classes: "X-XII" },
    { num: "15", name: "iBlueprint", cat: "CREATE", classes: "X-XII" },
    { num: "16", name: "Pitch Craft", cat: "ARENA", classes: "VIII-XII" },
    { num: "17", name: "Flabbergast", cat: "ARENA", classes: "X-XII" },
    { num: "18", name: "Space-Ola", cat: "ARENA", classes: "VI-XII" },
    { num: "19", name: "Radiant Rumble", cat: "ARENA", classes: "IX-XII" },
    { num: "20", name: "Sumo Slam Bots", cat: "CODE", classes: "IX-XII" },
    { num: "21", name: "Technical Taboo", cat: "ARENA", classes: "X-XII" },
    { num: "22", name: "Code Crackers", cat: "CODE", classes: "XI-XII" },
    { num: "23", name: "Collision", cat: "CYBER", classes: "VIII-XII" },
  ];

  return (
    <main>
      <nav className="navbar">
        <div className="nav-brand">Hash 12.0</div>
        <div className="nav-links">
          {/* Placeholder buttons until exact data is provided */}
          <button className="nav-btn">Home</button>
          <button className="nav-btn">Schedule</button>
          <button className="nav-btn">Leaderboard</button>
          <button className="nav-btn">Challenges</button>
          <button className="nav-btn accent-btn">Register</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-label">DL DAV Model School Shalimar Bagh Presents</div>
        <h1>
          Hash <span>12.0</span>
        </h1>
        <p>
          The premier inter-school technology festival. Eleven years of innovation, breaking boundaries, and creative out-thinking. Step into the twelfth era.
        </p>
        <div className="hero-buttons">
          <button className="btn-sharp btn-accent">Explore Events</button>
          <button className="btn-sharp">Register Now</button>
        </div>
      </section>

      <section className="events-section">
        <div className="section-header">
          <h2>The Programme</h2>
          <p>23 EVENTS &middot; 2026 EDITION</p>
        </div>

        <div className="grid-container">
          {events.map((event) => (
            <div key={event.num} className="event-card" data-cat={event.cat}>
              <span className="category">{event.cat} &mdash; {event.num}</span>
              <h3>{event.name}</h3>
              <div className="classes">CLASSES: {event.classes}</div>
            </div>
          ))}
        </div>
      </section>
      
      <ChatWidget />
    </main>
  );
}
