import * as React from 'react'
import styled from 'styled-components'
import { MutableRefObject, useCallback, useContext, useRef } from 'react'
import { ProjectStoreContext } from '../App'

const InterfaceWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.1);
`

export const UserInterface = () => {
  const store = useContext(ProjectStoreContext);
  const audioRef = useRef(null);

  return (
    <InterfaceWrapper>
      <label form={'audioFile'}> Choose an audio file:
        <input onChange={(e) => {
          store.loadAudio(audioRef, e.target.files[0]);
        }}
               type={'file'}
               id={'audioFile'}
               accept={'audio/*'} />
      </label>
      <audio ref={audioRef} id={'audioPlayer'} controls={true} />
    </InterfaceWrapper>
  )
}