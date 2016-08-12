/**
 * @author Mino Togna
 */

require( './footer.scss' )

var template = require( './footer.html' )
var html     = $( template( {} ) )

var Logo = null

var init = function () {
    $( '.app' ).append( html )
    Logo = html.find( ".sepal-logo" )
}

var hide = function () {
    html.velocity( { bottom: '-7%' }, { delay: 200, duration: 1200, easing: 'easeOutQuint' } )
}

var show = function () {
    html.velocity( { bottom: '0' }, { delay: 1000, duration: 1000, easing: 'easeOutQuint' } )
}

var showLogo = function () {
    $.each( Logo.find( 'div' ), function ( i, e ) {
        var elem = $( this )
        elem.velocity( "fadeIn", { display: "inline-block", delay: i * 1000, easing: 'swing' } )
    } )
}

module.exports = {
    init      : init
    , show    : show
    , hide    : hide
    , showLogo: showLogo
}