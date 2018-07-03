import _ from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'store'
import {Toolbar, ToolbarButton} from 'widget/toolbar'
import {RecipeActions, RecipeState, SceneSelectionType} from '../mosaicRecipe'
import styles from './mosaicToolbar.module.css'
import {PANELS} from './panelConstants'

const mapStateToProps = (state, ownProps) => {
    const recipeState = RecipeState(ownProps.recipeId)
    const sceneAreas = recipeState('ui.sceneAreas')

    return {
        selectedPanel: recipeState('ui.selectedPanel'),
        modal: recipeState('ui.modal'),
        sceneAreasLoaded: sceneAreas && Object.keys(sceneAreas).length > 0,
        scenesSelected: !!_.flatten(Object.values(recipeState('scenes') || {})).length,
        initialized: recipeState('ui.initialized'),
        sceneSelectionType: (recipeState('sceneSelectionOptions') || {}).type,
    }
}

class MosaicToolbar extends React.Component {
    constructor(props) {
        super(props)
        this.recipe = RecipeActions(props.recipeId)
    }

    render() {
        const {className, selectedPanel, modal, sceneAreasLoaded, scenesSelected, initialized, sceneSelectionType} = this.props
        return (
            <div className={className}>
                <div className={styles.toolbarGroup}>
                    <Toolbar className={styles.mosaicToolbar} vertical panel>
                        <Panel
                            panel={PANELS.AUTO}
                            icon={'magic'}
                            selectedPanel={selectedPanel}
                            recipe={this.recipe}
                            disabled={modal || !sceneAreasLoaded}/>
                        <Panel
                            panel={PANELS.CLEAR_SELETED_SCENES}
                            icon={'trash'}
                            selectedPanel={selectedPanel}
                            recipe={this.recipe}
                            disabled={modal || !scenesSelected}/>
                        <Panel
                            panel={PANELS.RETRIEVE}
                            icon={'cloud-download-alt'}
                            selectedPanel={selectedPanel}
                            recipe={this.recipe}
                            disabled={
                                modal
                                || !initialized
                                || (sceneSelectionType === SceneSelectionType.SELECT && !scenesSelected)}/>
                    </Toolbar>
                    <Toolbar className={styles.mosaicToolbar} vertical panel>
                        <Panel
                            panel={PANELS.AREA_OF_INTEREST}
                            selectedPanel={selectedPanel}
                            recipe={this.recipe}
                            disabled={modal}/>
                        <Panel
                            panel={PANELS.DATES}
                            selectedPanel={selectedPanel}
                            recipe={this.recipe}
                            disabled={modal}/>
                        <Panel
                            panel={PANELS.SOURCES}
                            selectedPanel={selectedPanel}
                            recipe={this.recipe}
                            disabled={modal}/>
                        <Panel
                            panel={PANELS.SCENES}
                            selectedPanel={selectedPanel}
                            recipe={this.recipe}
                            disabled={modal}/>
                        <Panel
                            panel={PANELS.COMPOSITE}
                            selectedPanel={selectedPanel}
                            recipe={this.recipe}
                            disabled={modal}/>
                    </Toolbar>
                </div>
            </div>
        )
    }
}

MosaicToolbar.propTypes = {
    className: PropTypes.string,
    recipeId: PropTypes.string,
    selectedPanel: PropTypes.string,
    modal: PropTypes.bool
}

const Panel = ({panel, icon, selectedPanel, recipe, disabled = false}) => {
    const selected = panel === selectedPanel
    return (
        <ToolbarButton
            disabled={disabled}
            selected={selected}
            onClick={() => recipe.selectPanel(selected ? null : panel).dispatch()}
            icon={icon}
            label={`process.mosaic.panel.${panel}.button`}
            tooltip={`process.mosaic.panel.${panel}`}/>
    )
}

Panel.propTypes = {
    panel: PropTypes.string,
    icon: PropTypes.string,
    selectedPanel: PropTypes.string,
    recipe: PropTypes.object,
    disabled: PropTypes.bool
}

export default connect(mapStateToProps)(MosaicToolbar)