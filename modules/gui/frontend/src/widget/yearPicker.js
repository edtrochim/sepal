import Combo from 'widget/combo'
import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import styles from './yearPicker.module.css'

export default class YearPicker extends React.Component {
    getOptions() {
        const {startYear, endYear} = this.props
        return _.concat(
            _.range(startYear - 5, startYear).map(year => ({label: year})),
            _.range(startYear, endYear + 1).map(year => ({label: year, value: year})),
            _.range(endYear + 1, endYear + 6).map(year => ({label: year}))
        )
    }

    render() {
        const {input, label, placement, tooltip, tooltipPlacement, autoFocus, errorMessage, onChange} = this.props
        return (
            <Combo
                className={styles.yearPicker}
                input={input}
                label={label}
                options={this.getOptions()}
                placement={placement}
                tooltip={tooltip}
                tooltipPlacement={tooltipPlacement}
                autoFocus={autoFocus}
                onChange={onChange}
                errorMessage={errorMessage}
                alignment='center'
            />
        )
    }
}

YearPicker.propTypes = {
    autoFocus: PropTypes.any,
    endYear: PropTypes.any,
    input: PropTypes.object,
    placement: PropTypes.string,
    portal: PropTypes.object,
    startYear: PropTypes.any,
    year: PropTypes.object,
    onChange: PropTypes.func
}
