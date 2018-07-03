import moment from 'moment'
import PropTypes from 'prop-types'
import React from 'react'
import {animationFrameScheduler, interval, Subject} from 'rxjs'
import {debounceTime, filter, first, map, scan, skip, switchMap, takeUntil} from 'rxjs/operators'
import {Input} from 'widget/form'
import Icon from 'widget/icon'
import styles from './datePicker.module.css'

const range = (from, to) =>
    Array.from({length: (to - from + 1)}, (v, k) => k + from)

const ANIMATION_SPEED = .2
const AUTO_CENTER_DELAY = 1000

const YEAR = 'year'
const MONTH = 'month'
const DAY = 'day'

const items = [YEAR, MONTH, DAY]

const currentScrollOffset = (element) => {
    return element.parentNode.scrollTop
}
const targetScrollOffset = (element) => {
    return Math.round(element.offsetTop - element.parentNode.offsetTop - element.parentNode.clientHeight / 2)
}

const setScrollOffset = (element, value) =>
    element.parentNode.scrollTop = value

const lerp = (rate) =>
    (value, targetValue) => value + (targetValue - value) * rate

const daysInMonth = (year, month) =>
    moment().year(year).month(month).daysInMonth()

const toMomentUnit = (item) => {
    switch (item) {
        case DAY:
            return 'date'
        default:
            return item
    }
}
class DatePicker extends React.Component {
    state = {edit: false}
    inputElement = React.createRef()

    editDate(edit) {
        this.setState((prevState) =>
            ({...prevState, edit}))
    }

    render() {
        const {input, startDate, endDate, resolution = DAY, className, ...props} = this.props
        const {edit} = this.state
        return (
            <div className={className}>
                <div className={[styles.input, styles[resolution]].join(' ')}>
                    <Input
                        {...props}
                        ref={this.inputElement}
                        input={input}
                        maxLength={10}
                        autoComplete='off'
                        onClick={() => this.editDate(true)}
                        onFocus={() => this.editDate(true)}
                        onBlur={() => this.editDate(false)}
                    />
                    <Icon name='calendar'
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                              if (!edit)
                                  this.inputElement.current.focus()
                              this.editDate(!edit)
                          }}/>
                    {edit
                        ? <DatePickerControl
                            startDate={startDate}
                            endDate={endDate}
                            input={input}
                            resolution={resolution}
                            onSelect={() => this.editDate(false)}
                            />
                        : null}
                </div>
            </div>
        )
    }

    // componentDidUpdate(nextProps, prevState) {
    //     const {input, resolution = DAY} = this.props
    //     const prevDateString = input.value
    //     if (!prevDateString)
    //         return

    //     const date = moment(prevDateString, getDateFormat(this.getResolution(prevDateString)), true)
    //     if (!date.isValid())
    //         return
    //     const nextDateString = date.format(getDateFormat(resolution))
    //     if (prevDateString !== nextDateString)
    //         input.set(nextDateString)
    // }

    getResolution(dateString) {
        switch(dateString.length) {
            case 4: return YEAR
            case 7: return MONTH
            default: return DAY
        }
    }
}

DatePicker.propTypes = {
    date: PropTypes.object,
    startDate: PropTypes.any,
    endDate: PropTypes.any,
    resolution: PropTypes.string
}

class DatePickerControl extends React.Component {
    constructor(props) {
        super(props)
        const {input, resolution} = props
        const date = this.parseDate(input.value)
        this.items = items.slice(0, items.indexOf(resolution) + 1)

        this.state = {
            highlighted: false
        }
        this.selected = {}
        this.subscriptions = []
        this.select$ = new Subject()

        if ([YEAR, MONTH, DAY].includes(resolution))
            this.state.year = this.initializeItem(YEAR, date)

        if ([MONTH, DAY].includes(resolution))
            this.state.month = this.initializeItem(MONTH, date)

        if ([DAY].includes(resolution))
            this.state.day = this.initializeItem(DAY, date)

        this.scroll$ = new Subject()
        this.unsubscribeOnUnmount(this.autoCenterWhenIdle(this.scroll$))
    }

    initializeItem(item, date) {
        this.selected[item] = React.createRef()
        this.unsubscribeOnUnmount(this.select(this.select$, item))
        return this.getDateItem(date, item)
    }

    unsubscribeOnUnmount(subscription) {
        this.subscriptions.push(subscription)
    }

    select(select$, item) {
        const animationFrame$ = interval(0, animationFrameScheduler)
        return select$.pipe(
            filter(selected => selected.item === item),
            map(selected => selected.element),
            filter(element => element),
            switchMap((element) => {
                const target = targetScrollOffset(element)
                const scroll$ = animationFrame$.pipe(
                    map(() => target),
                    scan(lerp(ANIMATION_SPEED), currentScrollOffset(element))
                )
                const stop$ = scroll$.pipe(
                    filter(value => Math.abs(value - target) < .5),
                    skip(1), // delay stop event
                    first() // just one stop event
                )
                return scroll$.pipe(
                    map((value) => ({element, value})),
                    takeUntil(stop$)
                )
            })
        ).subscribe(({element, value}) => setScrollOffset(element, Math.round(value)))
    }

    autoCenterWhenIdle(scroll$) {
        return scroll$.pipe(
            debounceTime(AUTO_CENTER_DELAY)
        ).subscribe(() => {
            this.centerSelected()
        })
    }

    set(item, value) {
        this.setState((prevState) => {
            const state = {...prevState}
            const {resolution} = this.props
            state[item] = value
            if (resolution === DAY && item !== DAY) {
                // adjust day of month if not allowed in current month
                state.day = Math.min(prevState.day, daysInMonth(state.year, state.month))
            }
            return state
        })
    }

    highlight(value) {
        this.setState((prevState) => {
            const state = {...prevState}
            state.highlighted = value
            return state
        })
    }

    parseDate(date) {
        return moment(date, getDateFormat(this.props.resolution), true)
    }

    formatDate(date) {
        return date.format(getDateFormat(this.props.resolution))
    }

    getDateItem(date, item) {
        return date.get(item === DAY ? 'date' : item)
    }

    centerItem(item, element) {
        this.select$.next({item, element})
    }

    centerSelected() {
        this.items.map(item => this.centerItem(item, this.selected[item].current))
    }

    renderItem(item, value) {
        const displayValue = item === MONTH
            ? moment().month(value).format('MMM')
            : value
        const selected = this.state[item] === value
        const select = (e, item, value) => {
            const {input, resolution, onSelect} = this.props
            const completeDate = !this.items
                .filter((i) => i !== item)
                .find((i) => {
                    return !(this.state[i] >= 0)
                })
            if (completeDate) { // If year, month, day specified in state
                const date = moment().set(toMomentUnit(item), value)
                this.items
                    .filter((i) => i !== item)
                    .forEach((i) => date.set(toMomentUnit(i), this.state[i]))
                input.set(this.formatDate(date))
            }
            this.set(item, value)
            if (resolution === YEAR && onSelect) {
                onSelect()
            } else {
                this.centerItem(item, e.target)
            }
        }
        return selected ? (
            <li
                key={value}
                ref={this.selected[item]}
                onMouseOver={() => this.highlight(true)}
                onMouseOut={() => this.highlight(false)}
                className={this.state.highlighted ? styles.highlighted : styles.selected}>{displayValue}</li>
        ) : (
            <li
                key={value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => select(e, item, value)}>
                {displayValue}
            </li>
        )
    }

    renderList(item, range) {
        return (
            <ul
                key={item}
                onMouseOver={() => this.scroll$.next(item)}
                onScroll={() => this.scroll$.next(item)}
                className={styles[item]}>
                {range.map((value) => this.renderItem(item, value))}
            </ul>
        )
    }

    renderPicker(item) {
        let {startDate, endDate} = this.props
        startDate = this.parseDate(startDate)
        endDate = this.parseDate(endDate)
        const {year, month} = this.state
        const days = month ? daysInMonth(year, month) : 31
        switch (item) {
            case YEAR:
                return this.renderList(YEAR, range(startDate.year(), endDate.year()))
            case MONTH:
                const minMonth = year === startDate.year() ? startDate.month() : 0
                const maxMonth = year === endDate.year() ? endDate.month() : 11
                return this.renderList(MONTH, range(minMonth, maxMonth))
            case DAY:
                const minDay = year === startDate.year() && month === startDate.month() ? startDate.date() : 1
                const maxDay = year === endDate.year() && month === endDate.month() ? endDate.date() : days
                return this.renderList(DAY, range(minDay, maxDay))
            default:
        }
    }

    render() {
        return (
            <div className={styles.control}>
                <div className={styles.picker}>
                    {this.items.map(item => this.renderPicker(item))}
                </div>
            </div>
        )
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.center) {
            this.center = false
            this.centerSelected()
        }

        const nextState = {...this.state}
        const changed = this.items.find((item) => {
            const prevValue = prevState[item]
            const date = this.parseDate(this.props.input.value)
            if (!date.isValid())
                return false
            const value = date.get(toMomentUnit(item))
            nextState[item] = value
            if (prevValue !== value) {
                this.set(item, value)
                return true
            }
            return false
        })
        if (changed)
            this.center = true
    }

    componentWillUnmount() {
        this.subscriptions.map(subscription => subscription.unsubscribe())
    }

    componentDidMount() {
        this.centerSelected()
    }
}

const getDateFormat = (resolution) => {
    switch (resolution) {
        case YEAR:
            return 'YYYY'
        case MONTH:
            return 'YYYY-MM'
        case DAY:
            return 'YYYY-MM-DD'
        default:
            throw new Error('Invalid resolution: ' + resolution)
    }
}

DatePickerControl.propTypes = {
    date: PropTypes.object,
    startDate: PropTypes.any,
    endDate: PropTypes.any,
    resolution: PropTypes.string,
    onSelect: PropTypes.func
}

export default DatePicker