import { Slot } from 'radix-ui'

interface PageTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PageTitle: React.FC<PageTitleProps> = ({
  children,
  ...restProps
}) => {
  return (
    <Slot.Root {...restProps}>
      <div className="text-md font-bold">{children}</div>
    </Slot.Root>
  )
}
