import {Field, form} from 'widget/form'
import {RecipeActions, RecipeState} from '../changeDetectionRecipe'
import {initValues, withRecipePath} from 'app/home/body/process/recipe'
import {msg} from 'translate'
import AssetSection from './assetSection'
import Panel from 'widget/panel'
import PanelButtons from 'widget/panelButtons'
import PanelSections from 'widget/panelSections'
import PropTypes from 'prop-types'
import React from 'react'
import RecipeSection from './recipeSection'
import SectionSelection from './sectionSelection'
import styles from './source.module.css'

const fields = {
    section: new Field()
        .notBlank('process.changeDetection.panel.source.form.section.required'),
    recipe: new Field()
        .skip((value, {section}) => section !== 'recipe')
        .notBlank('process.changeDetection.panel.source.form.recipe.required'),
    asset: new Field()
        .skip((value, {section}) => section !== 'asset')
        .notBlank('process.changeDetection.panel.source.form.asset.required'),
}

class Source extends React.Component {
    constructor(props) {
        super(props)
        this.recipeActions = RecipeActions(props.recipeId)
    }

    render() {
        const {recipePath, number, form, inputs} = this.props
        const sections = [
            {
                icon: 'cog',
                title: msg(`process.changeDetection.panel.source${number}.title`),
                component: <SectionSelection section={inputs.section}/>
            },
            {
                value: 'RECIPE_REF',
                title: msg('process.changeDetection.panel.source.recipe.title'),
                component: <RecipeSection recipe={inputs.recipe}/>
            },
            {
                value: 'ASSET',
                title: msg('process.changeDetection.panel.source.asset.title'),
                component: <AssetSection asset={inputs.asset}/>
            }
        ]
        return (
            <Panel
                form={form}
                statePath={recipePath + '.ui'} className={styles.panel}
                onApply={values => this.recipeActions.setSource({
                    values,
                    model: valuesToModel(values),
                    number
                }).dispatch()}>
                <PanelSections sections={sections} selected={inputs.section} inputs={inputs}/>

                <PanelButtons/>
            </Panel>
        )
    }
}

Source.propTypes = {
    recipeId: PropTypes.string
}

const valuesToModel = values => {
    switch (values.section) {
    case 'ASSET':
        return {
            type: 'ASSET',
            id: values.asset
        }
    case 'RECIPE_REF':
        return {
            type: 'RECIPE_REF',
            id: values.recipe
        }
    default:
        throw new Error('Unexpected source section: ' + values.section)
    }
}

const modelToValues = (model = {}) => {
    switch (model.type) {
    case 'ASSET':
        return {
            section: 'ASSET',
            asset: model.id
        }
    case 'RECIPE_REF':
        return {
            section: 'RECIPE_REF',
            recipe: model.id
        }
    case undefined:
        return {}
    default:
        throw new Error('Unexpected source type: ' + model.type)
    }
}

export default withRecipePath()(
    initValues({
        getModel: props => RecipeState(props.recipeId)('model.source' + props.number),
        getValues: props => RecipeState(props.recipeId)('ui.source' + props.number),
        modelToValues,
        onInitialized: ({model, values, props}) =>
            RecipeActions(props.recipeId)
                .setSource({values, model, number: props.number})
                .dispatch()
    })(
        form({fields})(Source)
    )
)
