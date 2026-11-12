import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'dark' | 'paper'
export type ButtonSize = 'sm' | 'md' | 'lg'
interface BaseProps { variant?: ButtonVariant; size?: ButtonSize; icon?: LucideIcon; iconSide?: 'left' | 'right' }
interface ButtonProps extends BaseProps, ButtonHTMLAttributes<HTMLButtonElement> { children: ReactNode }
interface ButtonLinkProps extends BaseProps, AnchorHTMLAttributes<HTMLAnchorElement> { children: ReactNode }
function classes(variant: ButtonVariant, size: ButtonSize, className?: string) { return ['action', `action-${variant}`, `action-${size}`, className].filter(Boolean).join(' ') }
export function Button({ variant = 'primary', size = 'md', icon: Icon, iconSide = 'right', children, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={classes(variant, size, className)} {...rest}>{Icon && iconSide === 'left' && <Icon aria-hidden="true" size={18} />}<span>{children}</span>{Icon && iconSide === 'right' && <Icon aria-hidden="true" size={18} />}</button>
}
export function ButtonLink({ variant = 'primary', size = 'md', icon: Icon, iconSide = 'right', children, className, ...rest }: ButtonLinkProps) {
  return <a className={classes(variant, size, className)} {...rest}>{Icon && iconSide === 'left' && <Icon aria-hidden="true" size={18} />}<span>{children}</span>{Icon && iconSide === 'right' && <Icon aria-hidden="true" size={18} />}</a>
}
