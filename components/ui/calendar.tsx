"use client"

import * as React from "react"
import {
  DayPicker,
  type DayButton,
  type Locale,
} from "@daypicker/react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background p-3 [--cell-radius:var(--radius-4xl)] [--cell-size:--spacing(8)]",
        "in-data-[slot=card-content]:bg-transparent",
        "in-data-[slot=popover-content]:bg-transparent",
        "rtl:**:[.rdp-button_next>svg]:rotate-180",
        "rtl:**:[.rdp-button_previous>svg]:rotate-180",
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date: Date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-4 md:flex-row",
        month: "flex w-full flex-col gap-4",
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-[--cell-size] p-0 select-none aria-disabled:opacity-50"
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-[--cell-size] p-0 select-none aria-disabled:opacity-50"
        ),
        month_caption: "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
        dropdowns: "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",
        dropdown_root: "relative rounded-[--cell-radius]",
        dropdown: "absolute inset-0 bg-popover opacity-0",
        caption_label: cn(
          "font-medium select-none",
          captionLayout === "label"
            ? "text-sm"
            : "flex items-center gap-1 rounded-[--cell-radius] text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground"
        ),
        weekdays: "flex",
        weekday: "flex-1 rounded-[--cell-radius] text-[0.8rem] font-normal text-muted-foreground select-none",
        week: "mt-2 flex w-full",
        week_number_header: "w-[--cell-size] select-none",
        week_number: "text-[0.8rem] text-muted-foreground select-none",
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-[--cell-radius] p-0 text-center select-none",
          "[&:last-child[data-selected=true]_button]:rounded-r-[--cell-radius]",
          "[:first-child[data-selected=true]_button]:rounded-l-[--cell-radius]",
          "[&:nth-child(2)[data-selected=true]_button]:rounded-l-[--cell-radius]"
        ),
        range_start: "relative isolate z-0 rounded-l-[--cell-radius] bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
        range_middle: "rounded-none",
        range_end: "relative isolate z-0 rounded-r-[--cell-radius] bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
        today: "rounded-[--cell-radius] bg-muted text-foreground data-[selected=true]:rounded-none",
        outside: "text-muted-foreground aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            )
          }
          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="flex size-[--cell-size] items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-[--cell-size] flex-col gap-1 border-0 leading-none font-normal",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",
        "group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50",
        "data-[range-end=true]:rounded-[--cell-radius] data-[range-end=true]:rounded-r-[--cell-radius]",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground",
        "data-[range-start=true]:rounded-[--cell-radius] data-[range-start=true]:rounded-l-[--cell-radius]",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        "dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }