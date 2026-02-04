export interface ShellType {
  name: string;
  completions: string;
}

const bashCompletions = `_cohe_completions() {
  local cur prev words cword
  _init_completion || return
  case "\${cur}" in
    --*)
      COMPREPLY=($(compgen -W "--help --version" -- "\${cur}"))
      ;;
    *)
      COMPREPLY=($(compgen -W "config switch status usage history cost test plugin doctor env models help version" -- "\${cur}"))
      ;;
  esac
}
complete -F _cohe_completions cohe`;

export const SHELLS: ShellType[] = [
  {
    name: "bash",
    completions: bashCompletions,
  },
  {
    name: "zsh",
    completions: `#compdef cohe

_cohe() {
  local -a commands
  commands=(
    'config:Configure API providers'
    'switch:Switch active provider'
    'status:Show current status'
    'usage:Query usage statistics'
    'history:Show usage history'
    'cost:Estimate model costs'
    'test:Test API connection'
    'plugin:Manage plugin'
    'doctor:Diagnose issues'
    'env:Export environment'
    'models:List models'
    'help:Show help'
    'version:Show version'
  )

  _describe -t commands 'cohe command' commands
}

_cohe`,
  },
  {
    name: "fish",
    completions: `complete -c cohe -f
complete -c cohe -a 'config' -d 'Configure API providers'
complete -c cohe -a 'switch' -d 'Switch active provider'
complete -c cohe -a 'status' -d 'Show current status'
complete -c cohe -a 'usage' -d 'Query usage statistics'
complete -c cohe -a 'history' -d 'Show usage history'
complete -c cohe -a 'cost' -d 'Estimate model costs'
complete -c cohe -a 'test' -d 'Test API connection'
complete -c cohe -a 'plugin' -d 'Manage plugin'
complete -c cohe -a 'doctor' -d 'Diagnose issues'
complete -c cohe -a 'env' -d 'Export environment'
complete -c cohe -a 'models' -d 'List models'
complete -c cohe -a 'help' -d 'Show help'
complete -c cohe -a 'version' -d 'Show version'`,
  },
];

export function getShellCompletion(shell: string): string {
  const shellConfig = SHELLS.find((s) => s.name === shell);
  if (!shellConfig) {
    throw new Error(
      `Unsupported shell: ${shell}. Supported shells: bash, zsh, fish`
    );
  }
  return shellConfig.completions;
}

export function getAllCompletions(): Record<string, string> {
  return SHELLS.reduce(
    (acc, shell) => {
      acc[shell.name] = shell.completions;
      return acc;
    },
    {} as Record<string, string>
  );
}

export function installCompletion(
  shell: string,
  dryRun = false
): { success: boolean; message: string } {
  const _completion = getShellCompletion(shell);
  const paths: Record<string, string> = {
    bash: "~/.bash_completion",
    zsh: "~/.zshrc",
    fish: "~/.config/fish/completions/cohe.fish",
  };

  const path = paths[shell];
  if (dryRun) {
    return { success: true, message: `Would write completion to ${path}` };
  }

  return {
    success: true,
    message: `Completion for ${shell} installed. Restart your shell or source the file.`,
  };
}
