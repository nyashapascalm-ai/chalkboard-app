import Link from "next/link";
import styles from "./page.module.css";

const features = [
  ["Attendance and learner records", "Capture daily attendance, maintain complete learner profiles and retrieve school records without paper files."],
  ["Academic administration", "Manage classes, subjects, marks, report cards, timetables and teaching responsibilities from one workspace."],
  ["Fees and school finance", "Track fees, arrears, income, expenses, banking and subscription payments with clearer reporting."],
  ["School operations", "Coordinate admissions, staff, inventory, assets, announcements and school settings from one secure system."]
];

export default function Home() {
  return <main className={styles.site}>
    <header className={styles.header}><div className={styles.inner}>
      <Link href="/" className={styles.brand}><img src="/brand/chalkboard-logo.png" alt="Chalkboard"/></Link>
      <nav><a href="#features">Features</a><a href="#schools">For schools</a><Link href="/download">Download app</Link><Link href="/app" className={styles.signin}>Sign in</Link></nav>
    </div></header>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>School management platform</p><h1>School management.<span>Simplified.</span></h1><p className={styles.lead}>Chalkboard brings attendance, learner records, academics, finance, reporting and school operations into one clear digital workspace.</p><div className={styles.actions}><Link href="/app" className={styles.primary}>Open Chalkboard</Link><Link href="/download" className={styles.secondary}>Download the app</Link></div></div>
      <div className={styles.visual}><div className={styles.panel}><img src="/brand/chalkboard-logo.png" alt="Chalkboard"/><div className={styles.stats}><article><span>Learners</span><strong>1,248</strong></article><article><span>Attendance</span><strong>92%</strong></article><article><span>Classes</span><strong>34</strong></article></div><div className={styles.chart}>{[52,68,61,82,76,91,86].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div></div>
    </section>
    <section id="features" className={styles.section}><p className={styles.eyebrow}>Everything in one place</p><h2>Run the school with better information</h2><div className={styles.grid}>{features.map(([t,x],i)=><article key={t}><span>0{i+1}</span><h3>{t}</h3><p>{x}</p></article>)}</div></section>
    <section id="schools" className={styles.audience}><div><p className={styles.eyebrow}>Designed for real schools</p><h2>A clear workspace for every school role</h2><p>Administrators, teachers, owners and support teams receive the tools appropriate to their responsibilities while school information stays connected.</p></div><div className={styles.rolegrid}>{[["School administrators","Run operations and reporting"],["Teachers","Manage classes, attendance and marks"],["School owners","See finance, activity and performance"],["Support teams","Configure and support connected schools"]].map(([t,x])=><article key={t}><h3>{t}</h3><p>{x}</p></article>)}</div></section>
    <section className={styles.cta}><img src="/brand/chalkboard-logo.png" alt="Chalkboard"/><h2>Bring your school onto one connected platform.</h2><p>Open Chalkboard online or install it on Windows and mobile devices.</p><div className={styles.actions}><Link href="/app" className={styles.primary}>Sign in to Chalkboard</Link><Link href="/download" className={styles.light}>Install the app</Link></div></section>
    <footer className={styles.footer}><img src="/brand/chalkboard-logo.png" alt="Chalkboard"/><p>School Management. Simplified.</p><span>{"\u00A9"} 2026 Chalkboard</span></footer>
  </main>;
}
