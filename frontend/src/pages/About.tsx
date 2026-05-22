import { Card } from '@/components/ui/Card';

const REFERENCES = [
  { title: 'CFPB Financial Well-Being Framework', use: 'Financial safety, goal progress, emergency readiness and freedom to enjoy life.', url: 'https://www.consumerfinance.gov/consumer-tools/educator-tools/financial-well-being-resources/explore-findings/' },
  { title: 'Richard Thaler — Mental Accounting Matters', use: 'Goal buckets, budget categories and separate saving targets.', url: 'https://onlinelibrary.wiley.com/doi/abs/10.1002/%28SICI%291099-0771%28199909%2912%3A3%3C183%3A%3AAID-BDM318%3E3.0.CO%3B2-F' },
  { title: 'Consumer.gov — Making a Budget', use: 'Monthly budgeting and saving for goals or emergencies.', url: 'https://consumer.gov/your-money/making-budget' },
  { title: 'CFPB — Debt-to-Income Ratio', use: 'Debt pressure and purchase risk logic.', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/' },
  { title: 'Vanguard — Emergency Fund Guidance', use: 'Protecting your emergency fund before large purchases.', url: 'https://investor.vanguard.com/investor-resources-education/emergency-fund' },
  { title: 'Whillans et al. — Buying Time Promotes Happiness', use: 'Time-saving value and happiness scoring.', url: 'https://www.pnas.org/doi/10.1073/pnas.1706541114' },
  { title: 'Hashim et al. — Gamification Can Help Consumers Reach Their Saving Goals', use: 'Saving streaks, badges and gamified goal progress.', url: 'https://cepr.org/system/files/2022-08/Hashim%20-%20Gamification_Can_Help_Consumers_Reach_Their_Saving_Goals.pdf' },
  { title: 'Kivetz, Urminsky & Zheng — Goal-Gradient Effect', use: 'Progress bars, milestone motivation and near-completion motivation.', url: 'https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf' },
  { title: 'Thaler & Benartzi — Save More Tomorrow', use: 'Automatic saving recommendations and future-oriented commitments.', url: 'https://www.anderson.ucla.edu/documents/areas/fac/accounting/smartjpe226.pdf' },
  { title: 'web.dev — PWA Web App Manifest', use: 'PWA installability and app-like behaviour.', url: 'https://web.dev/learn/pwa/web-app-manifest' },
];

export function About() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 md:gap-6">
      <h1 className="text-2xl font-extrabold text-ink md:text-3xl">About Fiviko</h1>

      <Card padded animate={false}>
        <p className="leading-relaxed text-ink">
          Fiviko is inspired by research in <strong>financial well-being, mental accounting, budgeting,
          goal progress, saving behaviour and gamification</strong>. We turn well-established ideas into a
          friendly daily companion that helps you spend, save and decide with confidence.
        </p>
        <p className="mt-3 rounded-2xl bg-warning/10 p-3 text-sm leading-relaxed text-ink">
          <strong>Important:</strong> Fiviko does not claim to provide licensed financial advice. Our scores
          and recommendations are educational, based on your data and app-defined models.
        </p>
      </Card>

      <h2 className="text-lg font-extrabold text-ink">Research basis</h2>
      <div className="flex flex-col gap-3">
        {REFERENCES.map((r) => (
          <Card key={r.title} padded animate={false}>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="focus-ring font-bold text-primary hover:underline">
              {r.title} ↗
            </a>
            <p className="mt-1 text-sm text-ink-soft">{r.use}</p>
          </Card>
        ))}
      </div>

      <Card padded animate={false}>
        <h2 className="font-bold text-ink">Disclaimer</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Fiviko is a financial planning and decision-support tool. It provides educational insights based on
          user-entered data and app-defined scoring models. It does not provide licensed financial, investment,
          tax, or legal advice. Users should verify important financial decisions independently or consult a
          qualified professional.
        </p>
      </Card>
    </div>
  );
}
