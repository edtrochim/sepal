import actionBuilder from 'action-builder'
import {getRevisions, recipePath, RecipeState, revertToRevision$} from 'app/home/body/process/recipe'
import moment from 'moment'
import PropTypes from 'prop-types'
import React from 'react'
import {map} from 'rxjs/operators'
import {msg} from 'translate'
import {Field, form} from 'widget/form'
import {Panel, PanelContent, PanelHeader} from 'widget/panel'
import PanelButtons from 'widget/panelButtons'
import Portal from 'widget/portal'
import SelectionList from 'widget/selectionList'
import styles from './revisions.module.css'


const fields = {
    revision: new Field()
        .notBlank('process.revisions.required')
}

export const showRevisionsPanel = (recipeId, shown = true) =>
    actionBuilder('SHOW_REVISIONS', {shown})
        .set([recipePath(recipeId), 'ui.showRevisions'], shown)
        .dispatch()

const mapStateToProps = (state, ownProps) => {
    const recipeState = RecipeState(ownProps.recipeId)
    return {
        open: recipeState('ui.showRevisions')
    }
}

class Revisions extends React.Component {
    renderContent() {
        const {recipeId, inputs: {revision}} = this.props
        const options = getRevisions(recipeId).map(timestamp => {
            const date = moment(+timestamp)
            const label =
                <div className={styles.label}>
                    <div className={styles.date}>{date.format('MMM D YYYY, hh:mm:ss')}</div>
                    <div className={styles.fromNow}>{date.fromNow()}</div>
                </div>
            return {value: timestamp, label}
        })
        return (
            <SelectionList options={options} input={revision}/>
        )
    }

    renderPanel() {
        const {recipeId, form} = this.props
        return (
            <Portal>
                <Panel className={styles.panel} center modal>
                    <PanelHeader
                        icon='clock'
                        title={msg('process.revisions.title')}/>
                    <PanelContent className={styles.content}>
                        {this.renderContent()}
                    </PanelContent>
                    <PanelButtons
                        form={form}
                        isActionForm={true}
                        applyLabel={msg('process.revisions.revert')}
                        statePath={recipePath(recipeId, 'ui')}
                        onApply={({revision}) => this.revertToRevision(revision)}
                        onCancel={() => showRevisionsPanel(recipeId, false)}/>
                </Panel>
            </Portal>
        )
    }

    render() {
        const {open} = this.props
        return open ? this.renderPanel() : null
    }

    revertToRevision(revision) {
        const {recipeId, asyncActionBuilder} = this.props
        asyncActionBuilder('REVERT_TO_REVISION',
            revertToRevision$(recipeId, revision).pipe(
                map(() => showRevisionsPanel(recipeId, false))
            ))
            .dispatch()
    }
}

Revisions.propTypes = {
    recipeId: PropTypes.string.isRequired
}

export default form({fields, mapStateToProps})(Revisions)

