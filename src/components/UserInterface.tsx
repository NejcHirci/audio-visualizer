import * as React from 'react'
import styled from 'styled-components'
import { MutableRefObject, useCallback, useContext, useRef } from 'react'
import { ProjectStoreContext } from '../App'

const InterfaceWrapper = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
`


const Dashboard = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: start;
  gap: 25px;
  justify-self: end;
  padding-top: 25px;
  padding-bottom: 25px;
  width: 40%;
  height: 90%;
  background: rgba(255, 255, 255, 0.1);
`


export const AudioSelect = styled.div`
  label {
    margin-top: 20px;
    margin-left: 20px;
    padding: 10px;
    box-sizing: border-box;
    border: 2px solid #fff;
    letter-spacing: 0.01em;
    color: #fff;
    cursor: pointer;
    transition: opacity .4s;
    z-index: 2;

    &:hover {
      opacity: .8;
    }

    input {
      display: none;
    }
  }
`

export const AudioPlayer = styled.audio`
  width: 100vw;
  margin-left: auto;
  margin-right: auto;
`

export const UserInterface = () => {
  const store = useContext(ProjectStoreContext)
  const audioRef = useRef(null)

  return (
    <InterfaceWrapper>
      <Dashboard>
        <AudioSelect>
          <label form={'audioFile'}> Choose an audio file:
            <input onChange={(e) => {
              store.loadAudio(audioRef, e.target.files[0])
            }}
                   type={'file'}
                   id={'audioFile'}
                   accept={'audio/*'} />
          </label>
        </AudioSelect>
      </Dashboard>
      <AudioPlayer ref={audioRef} id={'audioPlayer'} controls={true} />
    </InterfaceWrapper>
  )
}