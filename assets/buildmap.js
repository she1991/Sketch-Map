var pageList = [];
var globalGutter = 300;
var orientationVertical = true;
var svgContainer = undefined;

var maxWidthAllPages = undefined;
var totalHeight = 0;
var zoom = undefined;

let linkVertical = d3.linkVertical()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });
let linkHorizontal = d3.linkHorizontal()
	.x(function(d) { return d.x; })
	.y(function(d) { return d.y; });

function parseExportJSON() {
	//Make a list of unique pages
	initPageList();
	//Parse artboards and organize them into pages
	organizeArtboardsPageList();
	//Calculate weight offsets for each
	calcPageWeight();
}

function initPageList() {
	prototype.pages.forEach(page => {
		let pageObj = {
			pageName: page.pageName,
			pageId: page.pageId,
			minX: undefined,
			minY: undefined,
			maxX: undefined,
			maxY: undefined,
			maxXArtboardWidth: 0,
			maxYArtboardHeight: 0,
			width: undefined,
			height: undefined,
			pageWeigthX: undefined,
			pageWeigthY: undefined,
			artboards: []
		};
		pageList.push(pageObj);
	});
}

function organizeArtboardsPageList() {
	Object.keys(prototype.artboards).forEach(artboardId => {
		//Get page for artboard
		let artboard = prototype.artboards[artboardId];
		//Put artboard inside artboards list of page object
		pageList.forEach(pageObj => {
			if(artboard.pageId === pageObj.pageId) {
				pageObj.artboards.push(artboard);
				if( pageObj.minX === undefined || pageObj.minX > artboard.artboardX ) {
					pageObj.minX = artboard.artboardX;
				}
				if( pageObj.minY === undefined || pageObj.minY > artboard.artboardY ) {
					pageObj.minY = artboard.artboardY;
				}
				if( pageObj.maxX === undefined || pageObj.maxX < artboard.artboardX ) {
					pageObj.maxX = artboard.artboardX;
					pageObj.maxXArtboardWidth = artboard.width;
				}
				if( pageObj.maxY === undefined || pageObj.maxY < artboard.artboardY ) {
					pageObj.maxY = artboard.artboardY;
					pageObj.maxYArtboardHeight = artboard.height;
				}
				return;
			}
		});
	});
	//Remove pages with no artboards
	for(var i = pageList.length - 1; i >= 0; i--) {
	    if( pageList[i].artboards.length === 0) {
	        pageList.splice(i, 1);
	    }
	}
}

//Calculate offset weights for all pages
function calcPageWeight() {
	let prevMinXPoint = undefined;
	let prevMaxYPoint = undefined;
	pageList.forEach(pageObj => {
		//load width and height attributes into pageObj
		pageObj.width = Math.hypot( 
			Math.abs( pageObj.minX - ( pageObj.maxX + pageObj.maxXArtboardWidth ) ),
			Math.abs( pageObj.minY - pageObj.minY ) );
		pageObj.height = Math.hypot( 
			Math.abs( ( pageObj.maxX + pageObj.maxXArtboardWidth ) - ( pageObj.maxX + pageObj.maxXArtboardWidth ) ),
			Math.abs( pageObj.minY - ( pageObj.maxY + pageObj.maxYArtboardHeight ) ) )
			+ globalGutter;
		if( prevMinXPoint === undefined && prevMaxYPoint === undefined ) {
			// first page case
			pageObj.pageWeigthX = 0;
			pageObj.pageWeigthY = 0;
		} else {
			pageObj.pageWeigthX = prevMinXPoint - pageObj.minX;
			pageObj.pageWeigthY = prevMaxYPoint - pageObj.minY + globalGutter;
		}
		//save values for previous points
		prevMinXPoint = pageObj.minX;
		prevMaxYPoint = pageObj.minY + pageObj.height;
	});
}

function initSVG() {
	let svg = d3.select('.svg-div').append('svg')
		.attr('class', 'top-svg');
	svgContainer = svg.append('g')
			.attr('class', 'svg-container');
	let defs = svgContainer.append('defs');
	defs.append('marker')
	    .attr('id', 'arrowhead')
	    .attr('class', 'arrowhead')
	    .attr('viewBox', '-10 -10 20 20')
	    .attr('refX', 0)
	    .attr('refY', 0)
	    .attr('markerWidth', 10)
	    .attr('markerHeight', 10)
	    .attr('stroke-width', 2)
	    .attr('orient', 'auto')
  	.append('polyline')
	  	.attr('class', 'arrowhead')
	    .attr("stroke-linejoin", "bevel")
	    .attr("points", "-6.75,-6.75 0,0 -6.75,6.75");
	defs.append('marker')
			.attr('id', 'dot')
		    .attr('class', 'dot')
		    .attr('viewBox', '-10 -10 20 20')
		    .attr('refX', 0)
		    .attr('refY', 0)
		    .attr('markerWidth', 10)
		    .attr('markerHeight', 10)
		    .attr('stroke-width', 2)
		    .attr('orient', 'auto')
		.append('circle')
		  	.attr('class', 'dot')
		   	.attr('r', 4);
	renderArtboards(svgContainer);
	renderConnectors(svgContainer);
	applyViewBox(svg);
}

function renderArtboards(svg) {
	let i = 0;
	pageList.forEach(pageObj => {
		if(pageObj.artboards.length > 0) {
			//set max width all pages
			if( maxWidthAllPages === undefined || pageObj.width > maxWidthAllPages ) {
				maxWidthAllPages = pageObj.width;
			}
			totalHeight += pageObj.height;
			let pageGroupElement = svg.append('g')
				.attr('class', 'page')
				.attr('pageId', pageObj.pageId)
				.attr('pageName', pageObj.pageName);
			pageObj.artboards.forEach(artboard => {
				renderArtboard(pageGroupElement, pageObj, artboard);
			});
			i = i + 1;
		}
	});
}

function renderArtboard(pageGroupElement, pageObj, artboard) {
	let artboardGroupElement = pageGroupElement.append('g')
		.attr('class', 'artboard')
		.attr('title', artboard.title)
		.attr('artboardId', artboard.artboardId);
	artboardGroupElement.append('rect')
		.attr('x', artboard.artboardX + pageObj.pageWeigthX - 1)
		.attr('y', artboard.artboardY + pageObj.pageWeigthY - 1)
		.attr('width', artboard.width + 2)
		.attr('height', artboard.height + 2)
		.attr('class', 'artboard-image-background');
	artboardGroupElement.append('image')
		.attr('x', artboard.artboardX + pageObj.pageWeigthX)
		.attr('y', artboard.artboardY + pageObj.pageWeigthY)
		.attr('width', artboard.width)
		.attr('height', artboard.height)
		.attr('xlink:href', `./${artboard.artboardId}.png`)
		.attr('class', 'artboard-image');
	artboard.hotspots.forEach(hotspot => {
		renderHotSpot(artboardGroupElement, pageObj, artboard, hotspot);
	});
}

function renderHotSpot(artboardGroupElement, pageObj, artboard, hotspot) {
	artboardGroupElement.append('rect')
		.attr('x', artboard.artboardX + hotspot.rectangle.x + pageObj.pageWeigthX)
		.attr('y', artboard.artboardY + hotspot.rectangle.y + pageObj.pageWeigthY)
		.attr('width', hotspot.rectangle.width)
		.attr('height', hotspot.rectangle.height)
		.attr('rx', 8)
		.attr('stroke-width', 2)
		.attr('class', 'hotspot');
}

function renderConnectors(svg){
	//iterate pages
	pageList.forEach(pageObj => {
		//iterate artboards
		pageObj.artboards.forEach(artboard => {
			//iterate through the hotspots
			artboard.hotspots.forEach(hotspotRect => {
				//find target artboard id, artboard obj
				//get reference to target
				let targetRect = svg.select(`g[artboardId="${hotspotRect.target}"]`).select('image[class="artboard-image"]');
				let targetX = parseInt(targetRect.attr('x'));
				let targetY = parseInt(targetRect.attr('y'));
				let targetWidth = parseInt(targetRect.attr('width'));
				let targetHeight = parseInt(targetRect.attr('height'));
				
				let points = this.getMinCoOrd(
					getKLMN(hotspotRect.rectangle.x + pageObj.pageWeigthX + artboard.artboardX, 
						hotspotRect.rectangle.y + pageObj.pageWeigthY + artboard.artboardY,
						hotspotRect.rectangle.width,
						hotspotRect.rectangle.height),
					getKLMN(targetX,
						targetY,
						targetWidth,
						targetHeight)
				);
				if(points.direction == 'vertical') {
					svg.append('path')
					  .attr('class', 'connector')
					  .attr('marker-end', 'url(#arrowhead)')
					  .attr('marker-start', 'url(#dot)')
					  .datum(points)
					  .attr('d', linkVertical)
					  .attr('fill', 'none')
					  .attr('stroke-width', 3);
				}
				else if(points.direction == 'horizontal') {
					svg.append('path')
					  .attr('class', 'connector')
					  .attr('marker-end', 'url(#arrowhead)')
					  .attr('marker-start', 'url(#dot)')
					  .datum(points)
					  .attr('d', linkHorizontal)
					  .attr('fill', 'none')
					  .attr('stroke-width', 3);
				}
			});
		});
	});
}

function getKLMN( xVal, yVal, width, height ) {
	//Get half of width
	let halfWidth = width/2;
	let halfHeight = height/2;
	let k = {
		x: xVal,
		y: yVal + halfHeight
	};
	let l = {
		x: xVal + halfWidth,
		y: yVal + height
	};
	let m = {
		x: xVal + width,
		y: yVal + halfHeight
	};
	let n = {
		x: xVal + halfWidth,
		y: yVal
	};
	return [ k, l, m, n ];
}

function getMinCoOrd( hotspotKLMN, targetKLMN ) {
	//Store min distance and co ordinates
	let hotspotCoOrd = null;
	let targetCoOrd = null;
	let minDist = null;

	let targetKLMNDirection = null;
	let targetKLMNCount = 0;
	//Loop n^2 complexity
	hotspotKLMN.forEach(hotspotPoint => {
		//loop thorugh target KLMN
		targetKLMN.forEach(targetPoint => {
			//Calculate distance
		  let dist = Math.sqrt(Math.abs(
		    Math.pow(hotspotPoint.x - targetPoint.x, 2)
		    +
		    Math.pow(hotspotPoint.y - targetPoint.y, 2)
		  ));
		  if( minDist === null || minDist > dist ) {
		  	minDist = dist;
		  	hotspotCoOrd = { x: hotspotPoint.x, y: hotspotPoint.y };
		  	targetCoOrd = { x: targetPoint.x, y: targetPoint.y };
		  	targetKLMNDirection = targetKLMNCount;
		  }
		  targetKLMNCount++;
		});
	});
	return {source: hotspotCoOrd, target: targetCoOrd, direction: ( targetKLMNDirection%2 ) ? 'vertical' : 'horizontal' };
}



function applyViewBox(svg) {
	svg.attr('viewBox', `${(pageList[0]).minX - 2} ${(pageList[0]).minY - 2} ${maxWidthAllPages + 4} ${totalHeight + 4}`);
	zoom = d3.zoom()
      .extent([[(pageList[0]).minX - 2, (pageList[0]).minY - 2], [maxWidthAllPages + 4, totalHeight + 4]])
      .scaleExtent([0.2, 10])
      .on("zoom", zoomed);
	svg.call(zoom);
	svg.transition().duration(1000).call(zoom.transform, d3.zoomIdentity.scale(0.7));
}

function zoomed() {
	svgContainer.attr("transform", d3.event.transform);
}

function connectorToggleClicked() {
	let connectorToggleButton = d3.select('.curve-toggle');
	if( connectorToggleButton.attr('title') === 'Hide connectors' ) {
		connectorToggleButton
			.attr('title', 'Show connectors')
			.classed('hide-connector', false)
			.classed('show-connector', true);
		d3.selectAll('.connector')
			.classed('connector-hidden', true);
		d3.selectAll('.hotspot')
			.classed('hotspot-hidden', true);
	} else {
		connectorToggleButton
			.attr('title', 'Hide connectors')
			.classed('hide-connector', true)
			.classed('show-connector', false);
		d3.selectAll('.connector')
			.classed('connector-hidden', false);
		d3.selectAll('.hotspot')
			.classed('hotspot-hidden', false);
	}
}

function fitToScreen() {
	let svg = d3.select('.top-svg');
	svg.transition().duration(1000).call(zoom.transform, d3.zoomIdentity);
}

function closeHelpDialog() {
	d3.select('.help-dialog').remove();
}