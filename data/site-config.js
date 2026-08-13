/* =========================================================
   SITE CONFIG — edit THIS file, not index.html.

   Everything that differs from one firm/designer to the next —
   name, tagline, contact details, location, team members — lives
   here. index.html only has placeholder text and IDs; js/script.js
   reads this file on page load and fills those placeholders in.

   Rules of thumb:
   - Keep the same property names/shape — only change the VALUES.
   - Strings can contain plain text only (no HTML tags).
   - To add/remove a team member, add/remove an object inside the
     `team` array below — the page rebuilds that section automatically.
   ========================================================= */

window.SITE_CONFIG = {

  // Browser tab title + search-engine description
  meta: {
    title: "SAAJVAN DESIGN STUDIO — We Shape the Essence of Modern Living",
    description: "SAAJVAN DESIGN STUDIO — residential and commercial interior architecture, space planning and 3D visualization."
  },

  // Logo block + header/footer brand name
  brand: {
    initials: "SDS",             // shown inside the small logo square
    nameLine1: "SAAJVAN DESIGN", // brand name, line 1
    nameLine2: "STUDIO"         // brand name, line 2
  },

  // Hero section (top of the homepage)
  hero: {
    eyebrow: "We shape the essence of modern living",
    headingLine1: "SAAJVAN DESIGN",
    headingLine2: "STUDIO",
    description: "From contemporary residences to sophisticated commercial spaces, we transform ideas into beautifully curated interiors — designed with precision, premium materials, and a commitment to spaces that are both visually stunning and effortlessly functional."
  },

  // Used in the footer + intro strip
  about: {
    introParagraph: "No one should be left holding a beautiful concept and asking, \"how do I actually build this?\" That is exactly why Saajvan Design Studio exists. We pair architectural rigor with considered planning, realistic visualization and hands-on execution — so an idea becomes a home, an office, or a storefront that not only inspires, but gets built.",
    footerTagline: "Interior architecture, space planning and 3D visualization — for projects worldwide."
  },

  // Contact details — used in the header CTA link, footer, CTA banner
  // and the floating WhatsApp / phone / Instagram buttons.
  contact: {
    email: "[EMAIL_ADDRESS]",
    phoneDisplay: "+91 9582300708",   // shown as text
    phoneHref: "tel:+919582300708",    // used in tel: / call links (digits only after "tel:")
    whatsappHref: "https://wa.me/919582300708",
    instagramHref: "https://instagram.com/saajvan",
    locationLine: "Based worldwide · Projects everywhere"
  },

  // Footer bottom line — © {year} {copyrightName}
  footer: {
    copyrightName: "SAAJVAN DESIGN STUDIO"
  },

  // About Us section — single founder profile.
  // `photo` should point to a file inside assets/images/.
  team: [
    { name: "Advitya Malhotra", role: "Principal Designer & Founder", photo: "assets/images/team-1.jpg" }
  ]

};
