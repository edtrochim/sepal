import {initValues} from 'app/home/body/process/recipe'
import PropTypes from 'prop-types'
import React from 'react'
import {msg} from 'translate'
import {activatable} from 'widget/activation/activatable'
import {form} from 'widget/form'
import FormPanel, {FormPanelButtons} from 'widget/formPanel'
import {PanelContent, PanelHeader} from 'widget/panel'
import {RecipeActions, RecipeState} from '../landCoverRecipe'
import styles from './typology.module.css'

const fields = {}

class Typology extends React.Component {
    constructor(props) {
        super(props)
        const {recipeId} = props
        this.recipeActions = RecipeActions(recipeId)
    }

    render() {
        const {recipePath, form} = this.props
        return (
            <FormPanel
                className={styles.panel}
                form={form}
                statePath={recipePath + '.ui'}
                onApply={values => this.recipeActions.setTypology({
                    values,
                    model: valuesToModel(values)
                }).dispatch()}>
                <PanelHeader
                    icon='cog'
                    title={msg('process.landCover.panel.typology.title')}/>

                <PanelContent>
                    {this.renderContent()}
                </PanelContent>

                <FormPanelButtons/>
            </FormPanel>
        )
    }

    renderContent() {
        return (
            <div className={styles.content}>
                Select (or create?) a typology somehow here.
            </div>
        )
    }
}

Typology.propTypes = {
    recipeId: PropTypes.string,
}

const valuesToModel = values => ({
    ...values
})

const modelToValues = (model = {}) => ({
    ...model
})

const policy = () => ({
    othersCanActivate: {},
    deactivateWhenActivated: {}
})

export default activatable('typology', policy)(
    initValues({
        getModel: props => RecipeState(props.recipeId)('model.typology'),
        getValues: props => RecipeState(props.recipeId)('ui.typology'),
        modelToValues,
        onInitialized: ({model, values, props}) =>
            RecipeActions(props.recipeId)
                .setTypology({values, model})
                .dispatch()
    })(
        form({fields})(Typology)
    )
)
