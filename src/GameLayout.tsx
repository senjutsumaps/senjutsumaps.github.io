import React, { Component } from 'react';
import { GridGenerator, Layout, Hexagon, Text, Pattern, HexUtils, Hex } from 'react-hexgrid';
import './GameLayout.css';
const log = require('loglevel');
import { TokenImage } from './TokenImage';
import GameTile from "./GameTile"

const VERSION: number = 1;

interface GameLayoutProps {
  // Properties can provide initial data to the component
  allowEditing?: boolean;
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
    this.state = this.getInitialState();
    log.setLevel('info');
  }

  getInitialState() {
    let hexagons = GridGenerator.hexagon(3).map((hex, index) => new GameTile(hex));
    let tokenSize = { width: 10, height: 10};
    return { hexagons: hexagons, tokenSize: tokenSize };
  }

  onClick(event: React.MouseEvent, source: any) {
    log.debug('onClick event triggered with source:', source);
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
    log.debug('onDrop event triggered with source and targetProps:', source, targetProps);
    const { hexagons } = this.state;
    const hexas = hexagons.map(hex => {
      // When hexagon is dropped on this hexagon, copy it's image and text
      if (HexUtils.equals(source.state.hex, hex)) {
        hex.setToken(targetProps.data);
        log.info('onDrop event triggered, updated hex:', hex);
      }
      return hex;
    });
    this.setState({ hexagons: hexas });
  }

  onDragStart(event: React.DragEvent, source: any) {
    log.debug('onDragStart event triggered with source:', source);
    // If this tile is empty, it can't be dragged
    if (!source.data.image) {
      event.preventDefault();
    }
  }

  // Allow drop on any hexagon in this layout
  onDragOver(event: React.DragEvent, source: any) {
    event.preventDefault();
  }

  // onDragEnd you can do some logic, e.g. to clean up hexagon if drop was success
  onDragEnd(event: React.DragEvent, source: any, success: boolean) {
    log.debug('onDragEnd event triggered with source and success:', source, success);
    if (!success) {
      return;
    }
    const { hexagons } = this.state;
    // When hexagon is successfully dropped, clear source hexagon
    const hexas = hexagons.map(hex => {
      if (HexUtils.equals(source.state.hex, hex)) {
        hex.clearToken();
      }
      return hex;
    });
    this.setState({ hexagons: hexas });
  }

  getGameStateAsJson() {
    // For each hexagon, check call hex.save() and add it to the array only if it is not null
    const simplifiedHexagons = this.state.hexagons.reduce<{ [key: string]: any; }[]>((acc, hex) => {
      const hexState = hex.save(VERSION);
      if(hexState != null) {
        return [...acc, hexState];
      }
      return acc;
    }, []);
    const saveState: {[key: string]: any;} = {'version': VERSION, 'hexagons': simplifiedHexagons};
    const gameStateJson = JSON.stringify(saveState);
    
    return gameStateJson;
  }

  setGameStateFromJson(json: string) {
    // convert json to array of hexagon states
    const saveState = JSON.parse(json);
    const hexStates = saveState.hexagons;
    const ver = saveState.version;
    log.info('getGameStateFromJson hexStates:', hexStates);
    // For each hexagon state, find the corresponding hexagon and call hex.restore()
    const { hexagons } = this.getInitialState();
    log.info('setGameStateFromJson reset hexas:', this.state.hexagons);
    const hexas = hexagons.map(hex => {
      let hexState;
      for (let i = 0; i < hexStates.length; i++) {
        if (HexUtils.equals(hexStates[i], hex)) {
          hexState = hexStates[i];
          break;
        }
      }
      if(hexState) {
        hex.restore(hexState, ver);
      }
      return hex;
    });
    this.setState({ hexagons: hexas });
    log.info('setGameStateFromJson restored hexas:', this.state.hexagons);
  }

  resetGameState() {
    this.setState(this.getInitialState());
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
              {...(this.props.allowEditing ? {
                onDragStart: (e, h) => this.onDragStart(e, h),
                onDragEnd: (e, h, s) => this.onDragEnd(e, h, s),
                onDrop: (e, h, t) => this.onDrop(e, h, t),
                onDragOver: (e, h) => this.onDragOver(e, h),
                onClick: (e, h) => this.onClick(e, h),
              } : {})}
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
