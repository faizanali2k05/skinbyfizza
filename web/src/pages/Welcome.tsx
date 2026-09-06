import { useNavigate } from 'react-router-dom';
import { Button, Logo, Text } from '../components';
import { welcomeImage } from '../data/decor';
import { useI18n } from '../i18n';

export default function Welcome() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="welcome">
      <img className="welcome__bg" src={welcomeImage} alt="" />

      <div className="welcome__inner">
        <Logo light />
      </div>

      <div className="welcome__inner">
        <Text variant="body" style={{ marginBottom: 'var(--sp-xxl)' }}>
          {t('auth.welcomeSubtitle')}
        </Text>

        <div className="stack">
          <Button title={t('auth.createAccount')} onClick={() => navigate('/sign-up')} />
          <Button title={t('auth.signIn')} variant="outline" onClick={() => navigate('/sign-in')} />
          <Button title={t('more.aboutClinic')} variant="ghost" onClick={() => navigate('/about')} />
        </div>
      </div>
    </div>
  );
}
