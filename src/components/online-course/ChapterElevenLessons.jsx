export function ChapterElevenOverview({ onBegin }) {
  return (
    <article className="oe-chapter-eleven-overview">
      <h3>FINAL TEST</h3>
      <div className="oe-final-test-entry">
        <strong>11.1&nbsp; Final Test</strong>
        <button type="button" onClick={onBegin}>Click Here</button>
      </div>
    </article>
  )
}

export function FinalTestLesson({ onStart }) {
  return (
    <article className="oe-full-lesson oe-final-test-lesson">
      <h3>Final Test</h3>
      <section className="oe-final-test-card">
        <button type="button" onClick={onStart} aria-label="Start final test">
          <img src="/start.png" alt="Start Here" />
        </button>
        <img src="/quize.png" alt="Final test quiz illustration" />
      </section>
    </article>
  )
}
