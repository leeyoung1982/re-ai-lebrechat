// NOTE: Endpoint menu icons are driven by endpoint.iconURL (client-side injected).
// Do not add provider-matching logic here. See ICON_GUIDE.md for details.
import { Feather } from 'lucide-react';
import { EModelEndpoint, alternateName } from 'librechat-data-provider';
import {
  Sparkles,
  BedrockIcon,
  AnthropicIcon,
  AzureMinimalIcon,
  OpenAIMinimalIcon,
  GoogleMinimalIcon,
  CustomMinimalIcon,
} from '@librechat/client';
import UnknownIcon from '~/hooks/Endpoint/UnknownIcon';
import { IconProps } from '~/common';
import { cn } from '~/utils';

const getCustomEndpointIconURL = (props: any) => {
  if (!props) return null;

  const raw = [
    props.name,
    props.label,
    props.title,
    props.endpoint,
    props.endpointType,
    props.provider,
    props.value,
  ]
    .filter(Boolean)
    .join(' ');

  if (!raw) return null;

  const n = raw.toLowerCase();

  // Debug - 临时用于确认字段
  if (
    raw.includes('OpenAI') ||
    raw.includes('DOUBAO') ||
    raw.includes('Moonshot') ||
    raw.includes('re-AI-Radio')
  ) {
    console.log('MinimalIcon raw:', raw, 'props:', props);
  }

  if (n.includes('re-ai-radio') || n.includes('re ai radio') || n.includes('propose'))
    return '/assets/re-ai-radio.svg';

  if (n.includes('openai') || n.includes('chatgpt')) return '/assets/openai.svg';
  if (n.includes('gemini') || n.includes('google')) return '/assets/google.svg';
  if (n.includes('anthropic') || n.includes('claude')) return '/assets/anthropic.svg';

  if (n.includes('xai') || n.includes('grok')) return '/assets/xai.svg';
  if (n.includes('deepseek')) return '/assets/deepseek.svg';

  if (raw.includes('豆包') || n.includes('doubao') || n.includes('ark') || n.includes('volces'))
    return '/assets/doubao.svg';
  if (raw.includes('月之暗面') || n.includes('moonshot') || n.includes('kimi'))
    return '/assets/moonshot.svg';

  return null;
};

export default function MinimalIcon(props: IconProps) {
  const size = props.size ?? 30;
  const iconURL = props.iconURL ?? '';
  const iconClassName = props.iconClassName;
  const error = props.error;

  // Priority 1: Use iconURL from props (injected at data layer)
  if (iconURL && iconURL.startsWith('/assets/')) {
    const displayName = (props as any).name ?? (props as any).label ?? (props as any).title ?? '';
    return (
      <img
        src={iconURL}
        alt={displayName || 'endpoint'}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }

  // Priority 2: Fallback to custom endpoint icon detection for backward compatibility
  const customIconURL = getCustomEndpointIconURL(props);

  if (customIconURL) {
    const displayName = (props as any).name ?? (props as any).label ?? (props as any).title ?? '';
    return (
      <img
        src={customIconURL}
        alt={displayName || 'endpoint'}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }

  let endpoint = 'default';

  if (typeof props.endpoint === 'string') {
    endpoint = props.endpoint;
  }

  const endpointIcons = {
    [EModelEndpoint.azureOpenAI]: {
      icon: <AzureMinimalIcon className={iconClassName} />,
      name: props.chatGptLabel ?? 'ChatGPT',
    },
    [EModelEndpoint.openAI]: {
      icon: <OpenAIMinimalIcon className={iconClassName} />,
      name: props.chatGptLabel ?? 'ChatGPT',
    },
    [EModelEndpoint.google]: { icon: <GoogleMinimalIcon />, name: props.modelLabel ?? 'Google' },
    [EModelEndpoint.anthropic]: {
      icon: <AnthropicIcon className="icon-md shrink-0 dark:text-white" />,
      name: props.modelLabel ?? 'Claude',
    },
    [EModelEndpoint.custom]: {
      icon: <CustomMinimalIcon />,
      name: 'Custom',
    },
    [EModelEndpoint.assistants]: { icon: <Sparkles className="icon-sm" />, name: 'Assistant' },
    [EModelEndpoint.azureAssistants]: { icon: <Sparkles className="icon-sm" />, name: 'Assistant' },
    [EModelEndpoint.agents]: {
      icon: <Feather className="icon-sm" aria-hidden="true" />,
      name: props.modelLabel ?? alternateName[EModelEndpoint.agents],
    },
    [EModelEndpoint.bedrock]: {
      icon: <BedrockIcon className="icon-xl text-text-primary" />,
      name: props.modelLabel ?? alternateName[EModelEndpoint.bedrock],
    },
    default: {
      icon: <UnknownIcon iconURL={iconURL} endpoint={endpoint} className="icon-sm" context="nav" />,
      name: endpoint,
    },
  };

  let { icon, name } = endpointIcons[endpoint] ?? endpointIcons.default;
  if (iconURL && endpointIcons[iconURL] != null) {
    ({ icon, name } = endpointIcons[iconURL]);
  }

  return (
    <div
      data-testid="convo-icon"
      title={name}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
      }}
      className={cn(
        'relative flex items-center justify-center rounded-sm text-text-secondary',
        props.className ?? '',
      )}
    >
      {icon}
      {error === true && (
        <span className="absolute right-0 top-[20px] -mr-2 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-red-500 text-[10px] text-text-secondary">
          !
        </span>
      )}
    </div>
  );
}
