import * as React from 'react'
import styled from 'styled-components'
import { MutableRefObject, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ProjectStoreContext } from '../App'
import { set } from 'mobx'
import { ToggleButton } from './components/toggle'
import { mapLinear, randInt } from 'three/src/math/MathUtils'
import { observer } from "mobx-react-lite"

const InterfaceWrapper = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
`


const Dashboard = styled.div`
  justify-self: end;
  pointer-events: visible;
  min-width: 10px;
  max-width: 25%;
  display: flex;
  border-left: #e9e9e9 1px solid;
  color: black;
  flex-direction: row;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: -8px 2px 22px -7px rgb(0 0 0 / 25%);
  border-radius: 10px 0 0 10px;
`

const DashboardContent = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: nowrap;
  align-items: start;
  flex-direction: column;
  gap: 25px;
  justify-self: end;
  padding: 25px;
`


const AudioSelect = styled.div`
  pointer-events: auto;
  margin-left: auto;
  margin-right: auto;
  z-index: 99;
  label {
    background: #f15d22;
    border: none;
    border-radius: 5px;
    color: #fff;
    cursor: pointer;
    display: inline-block;
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 1rem;
    outline: none;
    padding: 1rem 20px;
    position: relative;
    transition: all 0.3s;
    vertical-align: middle;

    &:hover {
      background-color: darken(#f15d22, 10%);
    }

    input {
      height: 0;
      overflow: hidden;
      width: 0;
    }
  }
`

const AudioPlayer = styled.audio`
  pointer-events: visible;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
`

const Divider = styled.div`
  width: 100%;
  height: 3px;
  background: black;
  border-radius: 4px;
  border: black solid 1px;
`

export const UserInterface = observer(() => {
  const store = useContext(ProjectStoreContext)!;
  const audioRef = useRef(null);

  console.log(store);

  return (
    <InterfaceWrapper>
      <ResizableDashBoard>
        <AudioSelect>
          <label form={'audioFile'}> Choose an audio file
            <input onChange={(e) => {
              store.loadAudio(audioRef, e.target.files[0])
            }}
                   type={'file'}
                   id={'audioFile'}
                   accept={'audio/*'} />
          </label>
        </AudioSelect>
        <Divider/>
        { store.source !== undefined  &&
          <>
            <ChorusEffect/>
            <PhaserEffect/>
            <TremoloEffect/>
          </>
        }
      </ResizableDashBoard>
      <AudioPlayer ref={audioRef} id={'audioPlayer'} controls={true} />
    </InterfaceWrapper>
  )
});


const EffectGroup = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  gap: 25px;
`

const EffectTitle = styled.h2`
  font-size: 1.2rem;
  margin: 0;
  padding: 0;
`



export const ChorusEffect = observer(() => {
  const store = useContext(ProjectStoreContext)!;
  return (
    <div style={{display: 'flex', gap: '10px', flexDirection: 'column'}}>
      <EffectTitle>Chorus Effect</EffectTitle>
      <ToggleWrapper>
        <input type={"checkbox"} checked={store.isChorus} onClick={() => store.toggleChorus()}/>
        <span />
      </ToggleWrapper>
      <EffectGroup>
        <AudioEffect label={'Frequency'} maxValue={6} initialValue={0.1} onUpdate={(a) => {
          store.source && store.updateChorus(a, store.chorus.delayTime, store.chorus.depth);
        }}/>
        <AudioEffect label={'Delay Time'} maxValue={35} initialValue={store.chorus.delayTime} onUpdate={(a) => {
          store.source && store.updateChorus(4, a, store.chorus.depth);
        }}/>
        <AudioEffect label={'Depth'} maxValue={1.0} initialValue={store.chorus.depth} onUpdate={(a) => {
          store.source && store.updateChorus(0.1, store.chorus.delayTime, a);
        }}/>
      </EffectGroup>
    </div>
  );
});

export const PhaserEffect = observer(() => {
  const store = useContext(ProjectStoreContext)!;
  return (
    <div style={{display: 'flex', gap: '10px', flexDirection: 'column'}}>
      <EffectTitle>Phaser Effect</EffectTitle>
      <ToggleWrapper>
        <input type={"checkbox"} checked={store.isPhaser} onClick={() => store.togglePhaser()}/>
        <span />
      </ToggleWrapper>
      <EffectGroup>
        <AudioEffect label={'Frequency'} maxValue={30} initialValue={15} onUpdate={(a) => {
          store.source && store.updatePhaser(a, store.phaser.octaves, 350);
        }}/>
        <AudioEffect label={'Octaves'} maxValue={3} initialValue={store.phaser.octaves} onUpdate={(a) => {
          store.source && store.updatePhaser(0.5, a, 350);
        }}/>
        <AudioEffect label={'Base Frequency'} maxValue={350} initialValue={350} onUpdate={(a) => {
          store.source && store.updatePhaser(0.5, store.phaser.octaves, a);
        }}/>
      </EffectGroup>
    </div>
  );
});

export const TremoloEffect = observer(() => {
  const store = useContext(ProjectStoreContext)!;
  return (
    <div style={{display: 'flex', gap: '10px', flexDirection: 'column'}}>
      <EffectTitle>Tremolo Effect</EffectTitle>
      <ToggleWrapper>
        <input type={"checkbox"} checked={store.isTremolo} onClick={() => store.toggleTremolo()}/>
        <span />
      </ToggleWrapper>
      <EffectGroup>
        <AudioEffect label={'Frequency'} maxValue={10} initialValue={10} onUpdate={(a) => {
          store.source && store.updateTremolo(a, store.tremolo.depth.value) ;
        }}/>
        <AudioEffect label={'Depth'} maxValue={3} initialValue={store.chorus.delayTime} onUpdate={(a) => {
          store.source && store.updateTremolo(10, a);
        }}/>
      </EffectGroup>
    </div>
  );
});

const Knob = styled.div`
  justify-self: start;
  position: relative;
  width: 90px;
  padding: 7px 10px;
  border-radius: 6px;
  background-color: #2c2d2f;
  color: #f4f4f4;
  box-shadow: 0 3px 6px rgba(0,0,0,0.2);
  z-index: 99;
  
  .__container {
    display: block;
    overflow: hidden;
    position: relative;
    height: 70px;
    width: 70px;
  }
  .__svg {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 70px;
    width: 70px;    
    
    path {
      stroke-linecap: round;
      stroke-width: 6;
      fill: none;      
    }
  }
  .__dial {
    position: absolute;
    text-align: center;
    height: 48px;
    width: 48px;
    top: 50%;
    left: 50%;
    border: 6px solid #181b1c;
    border-radius: 100%;
    box-sizing: border-box;
    transform: translate(-50%, -50%);   
    
    ::after {
      content: "";
      position: absolute;
      top: 6px;
      height: 8px;
      width: 2px;
      background-color: #f4f4f4;      
    }
  }
  .__val {
    text-align: center;
    color: #fff;
    text-shadow: #21CD92 1px 0 10px;
    font-family: "Roboto Light", sans-serif;
  }
`

interface AudioEffectProps {
  maxValue: number,
  initialValue: number,
  label: string,
  onUpdate: (a:number) => void
}

export const AudioEffect = observer((props:AudioEffectProps) => {
  const [value, setValue] = useState(props.initialValue);
  const [prevVal, setPrevVal] = useState(0);

  const updateValue = (mouseY:number) => {
    let newValue = value - (mouseY - prevVal);
    if (newValue > props.maxValue) { newValue = props.maxValue; }
    else if (newValue < 0) { newValue = 0; }
    setValue(newValue);
    props.onUpdate && props.onUpdate(newValue);
  }

  const handleMouseMove = (e:any) => {
    updateValue(e.clientY);
    setPrevVal(e.clientY);
  }

  const handleMouseUp = (e: any) => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  const handleMouseDown = (e:any) => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    console.log(prevVal);
  }

  const getRotation = (val:number) => {
    return 184 - (184 / props.maxValue)*(val);
  }

  return (
    <Knob>
      <div className={`__val`}>
        {props.label}
      </div>
      <div className={"__container"} onMouseDown={handleMouseDown}>
        <svg className={"__svg"} viewBox={"0 0 100 100"}>
          <path
            d={"M20,76 A 40 40 0 1 1 80 76"}
            stroke={"#55595C"}
          />
          <path
            d={'M20,76 A 40 40 0 1 1 80 76'}
            stroke={"#21CD92"}
            strokeDasharray={184}
            style={{
              strokeDashoffset: getRotation(value),
              transition: '0.3s cubic-bezier(0, 0, 0.24, 1)'
            }}
          />
        </svg>
        <div
          className={`__dial`}
          style={{transform: `translate(-50%,-50%) rotate(${mapLinear(value, 0, props.maxValue, -120, 120)}deg)`}}
        />
      </div>
      <div className={`__val`}>
        {value}
      </div>
    </Knob>
  )
});


export const ResizableDashBoard:React.FC = (props) => {
  const [width, setWidth] = useState(0.4 * window.innerWidth);
  const barRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = React.useCallback((mouseDownEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        setWidth(
          barRef.current.getBoundingClientRect().right -
          mouseMoveEvent.clientX
        );
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <Dashboard style={{width: width}} ref={barRef} onMouseDown={event => event.preventDefault()}>
      <Resizer onMouseDown={startResizing}/>
      <DashboardContent>{props.children}</DashboardContent>
    </Dashboard>
  );
}

const Resizer = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: 6px;
  justify-self: flex-start;
  cursor: col-resize;
  resize: horizontal;
  
  :hover {
    width: 3px;
    background: #c1c3c5b4;
  }
`

const ToggleWrapper = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 30px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #2c3e50;
    transition: 0.3s;
    border-radius: 30px;
  }
  span:before {
    position: absolute;
    content: "";
    height: 25px;
    width: 25px;
    left: 3px;
    bottom: 2.6px;
    background-color: #fff;
    border-radius: 50%;
    transition: 0.3s;
  }

  input:checked + span {
    background-color: #00c853;
  }

  input:checked + span:before {
    transform: translateX(29px);
  }
`