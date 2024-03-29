import React, { Component } from 'react';
import { GridGenerator, Layout, Hexagon, Text, Pattern, HexUtils, Hex } from 'react-hexgrid';
import './GameLayout.css';
const log = require('loglevel');
import { TokenImage } from './TokenImage';
import GameTile from "./GameTile"

interface GameLayoutProps {
  // Define the types of your props here
}

interface GameLayoutState {
  hexagons: GameTile[];
  tokenSize: { width: number; height: number; };
}

// Represents the background image for a map section
class BackgroundImage extends Component {
  render() {
    return (
      <image href={`${process.env.PUBLIC_URL}/assets/BoardMaps_Snow.png`} x="-75" y="-50" height="100%" width="100%"/>
    );
  }
}

// Represents a section of a map composed of a set of hexagons
class GameLayout extends Component<GameLayoutProps, GameLayoutState> {
  constructor(props: GameLayoutProps) {
    super(props);
    let hexagons = GridGenerator.hexagon(3).map((hex, index) => new GameTile(hex));
    let tokenSize = { width: 10, height: 10}
    this.state = { hexagons, tokenSize };
    log.setLevel('info');
  }

  onClick(event: React.MouseEvent, source: any) {
    log.info('onClick event triggered with source:', source);
    const { hexagons } = this.state;
    const newHexagons = hexagons.map(hex => {
    if (HexUtils.equals(source.state.hex, hex)) {
      if(hex.blocked) {
        hex.rotate(true);
      }
      else {
        hex.colorIndex = (hex.colorIndex + 1) % hex.colors.length;
        hex.color = hex.colors[hex.colorIndex];
      }
      return hex;
    }
    return hex;
    });
    this.setState({ hexagons: newHexagons });
  }

  // onDrop you can read information of the hexagon that initiated the drag (targetProps)
  // and the source object of the drop event
  onDrop(event: React.DragEvent, source: any, targetProps: any) {
    log.info('onDrop event triggered with source and targetProps:', source, targetProps);
    const { hexagons } = this.state;
    const hexas = hexagons.map(hex => {
      // When hexagon is dropped on this hexagon, copy it's image and text
      if (HexUtils.equals(source.state.hex, hex)) {
        hex.image = targetProps.data.image;
        hex.text = targetProps.data.text;
        hex.blocked = true;
        hex.rotation = targetProps.data.rotation ? targetProps.data.rotation : 0;
        log.info('onDrop event triggered, updated hex:', hex);
      }
      return hex;
    });
    this.setState({ hexagons: hexas });
  }

  onDragStart(event: React.DragEvent, source: any) {
    log.info('onDragStart event triggered with source:', source);
    // If this tile is empty, let's disallow drag
    if (!source.data.image) {
      event.preventDefault();
    }
  }

  // Decide here if you want to allow drop to this node
  onDragOver(event: React.DragEvent, source: any) {
    // log.info('onDragOver event triggered with source:', source);
    // Find blocked hexagons by their 'blocked' attribute
    const blockedHexas = this.state.hexagons.filter(h => h.blocked);
    // Find if this hexagon is listed in blocked ones
    const blocked = blockedHexas.find(blockedHex => {
      return HexUtils.equals(source.state.hex, blockedHex);
    });

    if (!source) {
      // added to prevent undefined property error
      return;
    }
    const { text } = source.state; // maybe source.data is better?
    // Allow drop, if not blocked and there's no content already
    if (!blocked && !text) {
      // Call preventDefault if you want to allow drop
      event.preventDefault();
    }
    else {
      // This will allow us to replace an existing tile by dragging onto it
      // or we can drag onto ourself to delete it
      // kind of a hack, but it works.
      event.preventDefault();
    }
  }

  // onDragEnd you can do some logic, e.g. to clean up hexagon if drop was success
  onDragEnd(event: React.DragEvent, source: any, success: boolean) {
    log.info('onDragEnd event triggered with source and success:', source, success);
    if (!success) {
      return;
    }
    // TODO Drop the whole hex from array, currently somethings wrong with the patterns

    const { hexagons } = this.state;
    // When hexagon is successfully dropped, empty it's text and image
    const hexas = hexagons.map(hex => {
      if (HexUtils.equals(source.state.hex, hex)) {
        hex.text = undefined;
        hex.image = undefined;
        hex.blocked = false;
      }
      return hex;
    });
    this.setState({ hexagons: hexas });
  }

  render() {
    const hexagons: GameTile[] = this.state.hexagons;
    const tokenSize = this.state.tokenSize;
    return (
      <Layout className="game" size={{ x: 6.2, y: 6.2 }} flat={true} spacing={1.08} origin={{ x: -25.1, y: 0 }}>
        <>
        <BackgroundImage />
        {
          hexagons.map((hex: GameTile, i: number) => (
            <Hexagon
              key={i}
              q={hex.q}
              r={hex.r}
              s={hex.s}
              className={hex.blocked ? 'blocked' : undefined} // Not used anymore
              style={{ fill: hex.color }}
              fill={undefined}
              data={hex} // seems like data and state are not kept consistent, so keeping this for now
              onDragStart={(e, h) => this.onDragStart(e, h)}
              onDragEnd={(e, h, s) => this.onDragEnd(e, h, s)}
              onDrop={(e, h, t) => this.onDrop(e, h, t) }
              onDragOver={(e, h) => this.onDragOver(e, h) }
              onClick={(e, h) => this.onClick(e, h) }
            >
            <title>{hex.text}</title>
            { !!hex.image && <TokenImage id={HexUtils.getID(hex)} rotation={hex.rotation} link={hex.image} size={tokenSize} /> }
            </Hexagon>
          ))
        }
        </>
      </Layout>
    );
  }
}

export default GameLayout;
