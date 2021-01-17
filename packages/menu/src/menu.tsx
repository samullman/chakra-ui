import {
  chakra,
  forwardRef,
  HTMLChakraProps,
  omitThemingProps,
  PropsOf,
  StylesProvider,
  SystemProps,
  SystemStyleObject,
  ThemingProps,
  useMultiStyleConfig,
  useStyles,
} from "@chakra-ui/system"
import { cx, MaybeRenderProp, runIfFn, __DEV__ } from "@chakra-ui/utils"
import { motion, Variants } from "framer-motion"
import * as React from "react"
import {
  MenuProvider,
  useMenu,
  useMenuButton,
  useMenuContext,
  useMenuItem,
  UseMenuItemProps,
  useMenuList,
  useMenuOption,
  useMenuOptionGroup,
  UseMenuOptionGroupProps,
  UseMenuOptionOptions,
  useMenuPositioner,
  UseMenuProps,
} from "./use-menu"

export interface MenuProps extends UseMenuProps, ThemingProps {
  children: MaybeRenderProp<{
    isOpen: boolean
    onClose: () => void
    forceUpdate: (() => void) | null
  }>
}

/**
 * Menu provides context, state, and focus management
 * to its sub-components. It doesn't render any DOM node.
 */
export const Menu: React.FC<MenuProps> = (props) => {
  const { children } = props

  const styles = useMultiStyleConfig("Menu", props)
  const ownProps = omitThemingProps(props)

  const ctx = useMenu(ownProps)
  const context = React.useMemo(() => ctx, [ctx])

  const { isOpen, onClose, forceUpdate } = context

  return (
    <MenuProvider value={context}>
      <StylesProvider value={styles}>
        {runIfFn(children, { isOpen, onClose, forceUpdate })}
      </StylesProvider>
    </MenuProvider>
  )
}

if (__DEV__) {
  Menu.displayName = "Menu"
}

export interface MenuButtonProps extends HTMLChakraProps<"button"> {}

const StyledMenuButton = forwardRef<MenuButtonProps, "button">((props, ref) => {
  const styles = useStyles()
  return (
    <chakra.button
      ref={ref}
      {...props}
      __css={{
        display: "inline-flex",
        appearance: "none",
        alignItems: "center",
        outline: 0,
        transition: "all 250ms",
        ...styles.button,
      }}
    />
  )
})

/**
 * The trigger for the menu list. Must be a direct child of `Menu`.
 */
export const MenuButton = forwardRef<MenuButtonProps, "button">(
  (props, ref) => {
    const { children, as: As, ...rest } = props

    const buttonProps = useMenuButton(rest, ref)

    const ButtonComp = As || StyledMenuButton

    return (
      <ButtonComp
        {...buttonProps}
        className={cx("chakra-menu__menu-button", props.className)}
      >
        <chakra.span
          __css={{
            pointerEvents: "none",
            flex: "1 1 auto",
          }}
        >
          {props.children}
        </chakra.span>
      </ButtonComp>
    )
  },
)

if (__DEV__) {
  MenuButton.displayName = "MenuButton"
}

export interface MenuListProps extends HTMLChakraProps<"div"> {}

const motionVariants: Variants = {
  enter: {
    visibility: "visible",
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    transitionEnd: {
      visibility: "hidden",
    },
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.1,
      easings: "easeOut",
    },
  },
}

const Motion = chakra(motion.div)

export const MenuList = forwardRef<MenuListProps, "div">((props, ref) => {
  const { isOpen, onTransitionEnd } = useMenuContext()

  const listProps = useMenuList(props, ref)
  const positionerProps = useMenuPositioner()

  const styles = useStyles()

  return (
    <chakra.div {...positionerProps} __css={{ zIndex: styles.list?.zIndex }}>
      <Motion
        {...listProps}
        /**
         * We could call this on either `onAnimationComplete` or `onUpdate`.
         * It seems the re-focusing works better with the `onUpdate`
         */
        onUpdate={onTransitionEnd}
        className={cx("chakra-menu__menu-list", listProps.className)}
        variants={motionVariants}
        initial={false}
        animate={isOpen ? "enter" : "exit"}
        __css={{
          outline: 0,
          ...styles.list,
        }}
      />
    </chakra.div>
  )
})

if (__DEV__) {
  MenuList.displayName = "MenuList"
}

export interface StyledMenuItemProps extends HTMLChakraProps<"button"> {}

const StyledMenuItem = forwardRef<StyledMenuItemProps, "button">(
  (props, ref) => {
    const { type, ...rest } = props
    const styles = useStyles()

    /**
     * Given another component, use its type if present
     * Else, use no type to avoid invalid html, e.g. <a type="button" />
     * Else, fall back to "button"
     */
    const btnType = rest.as ? type ?? undefined : "button"

    const buttonStyles: SystemStyleObject = {
      textDecoration: "none",
      color: "inherit",
      userSelect: "none",
      display: "flex",
      width: "100%",
      alignItems: "center",
      textAlign: "left",
      flex: "0 0 auto",
      outline: 0,
      ...styles.item,
    }

    return (
      <chakra.button ref={ref} type={btnType} {...rest} __css={buttonStyles} />
    )
  },
)

interface MenuItemOptions
  extends Pick<UseMenuItemProps, "isDisabled" | "isFocusable"> {
  /**
   * The icon to render before the menu item's label.
   * @type React.ReactElement
   */
  icon?: React.ReactElement
  /**
   * The spacing between the icon and menu item's label
   * @type SystemProps["mr"]
   */
  iconSpacing?: SystemProps["mr"]
  /**
   * Right-aligned label text content, useful for displaying hotkeys.
   */
  command?: string
}

export interface MenuItemProps
  extends HTMLChakraProps<"button">,
    MenuItemOptions {}

export const MenuItem = forwardRef<MenuItemProps, "button">((props, ref) => {
  const { icon, iconSpacing = "0.75rem", command, children, ...rest } = props

  const menuItemProps = useMenuItem(rest, ref) as MenuItemProps

  const shouldWrap = icon || command

  const _children = shouldWrap ? (
    <chakra.span pointerEvents="none" flex="1">
      {children}
    </chakra.span>
  ) : (
    children
  )

  return (
    <StyledMenuItem
      {...menuItemProps}
      className={cx("chakra-menu__menuitem", menuItemProps.className)}
    >
      {icon && (
        <MenuIcon fontSize="0.8em" marginEnd={iconSpacing}>
          {icon}
        </MenuIcon>
      )}
      {_children}
      {command && <MenuCommand>{command}</MenuCommand>}
    </StyledMenuItem>
  )
})

if (__DEV__) {
  MenuItem.displayName = "MenuItem"
}

const CheckIcon: React.FC<PropsOf<"svg">> = (props) => (
  <svg viewBox="0 0 14 14" width="1em" height="1em" {...props}>
    <polygon
      fill="currentColor"
      points="5.5 11.9993304 14 3.49933039 12.5 2 5.5 8.99933039 1.5 4.9968652 0 6.49933039"
    />
  </svg>
)

export interface MenuItemOptionProps
  extends UseMenuOptionOptions,
    Omit<MenuItemProps, keyof UseMenuOptionOptions> {
  /**
   * @type React.ReactElement
   */
  icon?: React.ReactElement
  /**
   * @type SystemProps["mr"]
   */
  iconSpacing?: SystemProps["mr"]
}

export const MenuItemOption = forwardRef<MenuItemOptionProps, "button">(
  (props, ref) => {
    const { icon, iconSpacing = "0.75rem", ...rest } = props

    const optionProps = useMenuOption(rest, ref) as StyledMenuItemProps

    return (
      <StyledMenuItem
        {...optionProps}
        className={cx("chakra-menu__menuitem-option", rest.className)}
      >
        <MenuIcon
          fontSize="0.8em"
          marginEnd={iconSpacing}
          opacity={props.isChecked ? 1 : 0}
        >
          {icon || <CheckIcon />}
        </MenuIcon>
        <chakra.span flex="1">{optionProps.children}</chakra.span>
      </StyledMenuItem>
    )
  },
)

MenuItemOption.id = "MenuItemOption"

if (__DEV__) {
  MenuItemOption.displayName = "MenuItemOption"
}

export interface MenuOptionGroupProps
  extends UseMenuOptionGroupProps,
    Omit<MenuGroupProps, "value" | "defaultValue" | "onChange"> {}

export const MenuOptionGroup: React.FC<MenuOptionGroupProps> = (props) => {
  const { className, title, ...rest } = props
  const ownProps = useMenuOptionGroup(rest)
  return (
    <MenuGroup
      title={title}
      className={cx("chakra-menu__option-group", className)}
      {...ownProps}
    />
  )
}

if (__DEV__) {
  MenuOptionGroup.displayName = "MenuOptionGroup"
}

export interface MenuGroupProps extends HTMLChakraProps<"div"> {}

export const MenuGroup = forwardRef<MenuGroupProps, "div">((props, ref) => {
  const { title, children, className, ...rest } = props

  const _className = cx("chakra-menu__group__title", className)
  const styles = useStyles()

  return (
    <chakra.div ref={ref} className="chakra-menu__group" role="group">
      {title && (
        <chakra.p className={_className} {...rest} __css={styles.groupTitle}>
          {title}
        </chakra.p>
      )}
      {children}
    </chakra.div>
  )
})

if (__DEV__) {
  MenuGroup.displayName = "MenuGroup"
}

export interface MenuCommandProps extends HTMLChakraProps<"span"> {}

export const MenuCommand = forwardRef<MenuCommandProps, "span">(
  (props, ref) => {
    const styles = useStyles()
    return (
      <chakra.span
        ref={ref}
        {...props}
        __css={styles.command}
        className="chakra-menu__command"
      />
    )
  },
)

if (__DEV__) {
  MenuCommand.displayName = "MenuCommand"
}

export const MenuIcon: React.FC<HTMLChakraProps<"span">> = (props) => {
  const { className, children, ...rest } = props

  const child = React.Children.only(children)

  const clone = React.isValidElement(child)
    ? React.cloneElement(child, {
        focusable: "false",
        "aria-hidden": true,
        className: cx("chakra-menu__icon", child.props.className),
      })
    : null

  const _className = cx("chakra-menu__icon-wrapper", className)

  return (
    <chakra.span
      className={_className}
      {...rest}
      __css={{
        flexShrink: 0,
      }}
    >
      {clone}
    </chakra.span>
  )
}

if (__DEV__) {
  MenuIcon.displayName = "MenuIcon"
}

export interface MenuDividerProps extends HTMLChakraProps<"hr"> {}

export const MenuDivider: React.FC<MenuDividerProps> = (props) => {
  const { className, ...rest } = props
  const styles = useStyles()
  return (
    <chakra.hr
      role="separator"
      aria-orientation="horizontal"
      className={cx("chakra-menu__divider", className)}
      {...rest}
      __css={styles.divider}
    />
  )
}

if (__DEV__) {
  MenuDivider.displayName = "MenuDivider"
}
