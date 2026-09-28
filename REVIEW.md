# Toxic HR / Team Lead Review

**Update after the "make the stats actually impressive" pass:** all 7 cases now
have an explicit Goal and a detailed, phased Plan instead of a 3-bullet
summary, and the home page leads with the strongest number from each case
instead of process trivia like "15 shares." One tradeoff worth naming
directly: adding the NYC Legacy Team case pushed real estate to 5 of 7
cards, up from 4 of 6 before. That's the opposite direction from the
original "don't make this about real estate" brief. I made the call to
prioritize this turn's explicit ask (impressive, detailed, use what you gave
me) over the earlier ratio concern, since they were in direct tension and
the NYC case is genuinely the strongest strategic artifact in your source
material. Flagging it rather than letting it slide quietly.


Read as someone actively looking for a reason to reject you or the site, not
someone being polite. Split into what I fixed without asking, and what needs
your actual judgment call because it's a risk/permission question, not a code
bug.

## Fixed

**Q: Do the "Read the case" links actually go anywhere?**
A: No. All six 404'd — you build a page that promises depth and then hands
the visitor a dead end. Fixed: built all six case study pages plus
`method.html`, all linked and verified with no broken paths.

**Q: Is a real client name anywhere in the shipped code, even where it's not
visible in the browser?**
A: Yes. The "CONTENT SOURCE MAP" HTML comment on the home page named The
Opes Group, Stephanie Sills, The Goodhart Group, and DA Team by name.
Anyone using view-source (trivial, right-click, one click) saw the exact
clients you'd just anonymized in the visible text. Anonymizing the copy and
leaving the source open defeats the entire point. Fixed: removed; that
mapping now lives outside the shipped files.

**Q: Does the mobile hamburger button do anything?**
A: No. It rendered but had zero JavaScript behind it. On a phone — the most
likely way anyone actually views this — there was no way to reach About,
Method, or Contact except scrolling manually past everything. Fixed: wired
up open/close, closes automatically when a link is tapped.

**Q: Does the small gray text pass a basic accessibility contrast check?**
A: No. `#5E6478` on the near-black background measured about 3.3:1 — below
the 4.5:1 WCAG AA minimum for normal-size text. It was used on proof-strip
labels, case metric labels, and footer text, all small. Fixed: lightened to
`#838AA3`, comfortably over 4.5:1.

**Q: Is there a visible focus state for keyboard navigation?**
A: No, none was defined anywhere. Tab through the site with a keyboard and
you couldn't tell where you were. Fixed: added a visible focus ring on
every link and button.

**Q: Does the browser tab show a real icon or the generic blank one?**
A: Blank. Fixed: added a simple inline icon, no external image file needed.

**Q: Does the structured data (JSON-LD) contain a real URL?**
A: It had the literal string `"https://REPLACE-WITH-YOUR-DOMAIN.com"`. Any
tool that validates this markup — or a search engine — reads that as an
obviously fake, unfinished field. Fixed: removed the `url` property until
there's a real domain to put there; left a comment for when you deploy.

**Q: Do the case cards and method steps look cramped?**
A: Yes — you flagged this yourself. The earlier "minimalist" pass used a
1px hairline-grid trick between cards with zero real spacing, which reads
as cramped rather than clean. Fixed: real 16px gaps, individual card
borders.

**Q: Does the contact section box you into "posts," "audits," or
"consultations" specifically?**
A: Yes — the headline literally said "a stream of posts." You flagged this
too. Fixed: reworded to "If an account isn't growing the way it should,
let's talk about why" — no service list, no narrow framing.

**Q: Is 9.16% a defensible number to put on the site?**
A: No — already caught and fixed in the previous pass. The source deck
uses the same post to mean two different things (skip rate on one page,
interaction rate on another, likely two different denominators). Replaced
with unambiguous, single-basis stats everywhere it appeared.

## Needs your call — these aren't bugs, they're risk or judgment questions

**Q: You anonymized the client ("Miami Luxury Collective") but the About
section names your actual current employer, Level Up Creative, by name.
Anyone who knows Level Up's client roster — a coworker, a competitor, the
client themselves — can match the anonymized case back to the real one just
from knowing which Miami luxury team the agency works with. Does anonymizing
the client name protect anything if the agency name sits right next to it?**
A: Not answered here. This is the one that actually matters most for
confidentiality — worth deciding deliberately, not by default.

**Q: The case-note line says client data is anonymized "at my own
discretion." Does that mean you have not gotten explicit sign-off from Level
Up or the clients to publish even anonymized performance numbers publicly?**
A: If sign-off doesn't exist, anonymizing reduces risk but doesn't
eliminate it — the underlying numbers and campaign details are still
agency deliverables. Worth a two-line check with whoever owns those client
relationships before this goes live, not after someone else finds it.

**Q: The site calls you "Social Media Strategist." Your resume, LinkedIn,
and working profile say "SMM Manager" / "Social Media Marketing
Specialist." Is that a deliberate brand distinction or accidental drift?**
A: Recruiters and clients cross-reference. Pick one framing and use it
everywhere, or have a specific reason the portfolio uses different language
than the resume.

**Q: Four of six case cards and three of four hero stats are still real
estate, even though the original brief was explicitly "don't make this
about real estate." Is that ratio acceptable?**
A: I only had two strong non-real-estate projects in your source material
— the entertainment network and the YouTube channel. If there's a third
project outside real estate I haven't seen, send it over and I'll rebalance
the grid. Otherwise this is close to the honest ceiling of what the current
material supports.

**Q: "Available on request" is what every anonymized case study says, and
most visitors never follow up to actually request it. Is there anything
you can show without fully de-anonymizing — a blurred or redacted
screenshot, a one-page PDF with names stripped — that gives a skeptical
visitor more than your word?**
A: Not built. Worth considering if this site needs to survive real
scrutiny from a client or hiring manager who's seen anonymized case studies
turn out to be fabricated before.

**Q: No `og:image` is set. Sharing this link on LinkedIn or Slack currently
shows a blank preview card, not a screenshot of the site.**
A: Not built — needs an actual image asset, which I don't have. Low
priority unless you're about to actively share the link.
