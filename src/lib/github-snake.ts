export const GITHUB_SNAKE_LIGHT_SRC = '/github-snake/github-snake.svg';
export const GITHUB_SNAKE_DARK_SRC = '/github-snake/github-snake-dark.svg';

export function githubSnakeSrc(isDark: boolean) {
  return isDark ? GITHUB_SNAKE_DARK_SRC : GITHUB_SNAKE_LIGHT_SRC;
}
