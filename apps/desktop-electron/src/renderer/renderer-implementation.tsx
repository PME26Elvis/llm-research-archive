import { useEffect, useState } from 'react';
import type {
  RendererImplementation,
  RendererImplementationInfoDto,
} from '@research-observatory/platform-contracts';
import { usePreferences } from './preferences-context';

export function RendererImplementationControl({
  implementation,
}: {
  implementation: RendererImplementation;
}) {
  const { t } = usePreferences();
  const [info, setInfo] = useState<RendererImplementationInfoDto | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    void window.observatory
      .rendererInfo()
      .then(setInfo)
      .catch(() => undefined);
  }, [implementation]);

  const target: RendererImplementation = implementation === 'astro' ? 'classic' : 'astro';
  const activeLabel =
    implementation === 'astro' ? t('implementation.astro') : t('implementation.classic');
  const targetLabel = target === 'astro' ? t('implementation.astro') : t('implementation.classic');

  return (
    <div className="implementation-control" data-testid="renderer-implementation">
      <span
        className="implementation-badge"
        title={t('implementation.active', { label: activeLabel })}
      >
        {activeLabel}
      </span>
      <button
        type="button"
        className="implementation-switch"
        disabled={switching || (info ? !info.available.includes(target) : false)}
        aria-label={t('implementation.switchTo', { label: targetLabel })}
        onClick={() => {
          setSwitching(true);
          void window.observatory.setRenderer(target).catch(() => setSwitching(false));
        }}
      >
        {switching ? t('implementation.switching') : t('implementation.switch')}
      </button>
    </div>
  );
}
