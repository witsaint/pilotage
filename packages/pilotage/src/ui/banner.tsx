import process from 'node:process'
import { render } from 'ink'
import React from 'react'
import { LogoDesc } from './logo-desc'

export function renderBanner(): void {
  const shell = `                       
 _|_|_|    _|  _|              _|                                    
 _|    _|      _|    _|_|    _|_|_|_|    _|_|_|    _|_|_|    _|_|    
 _|_|_|    _|  _|  _|    _|    _|      _|    _|  _|    _|  _|_|_|_|  
 _|        _|  _|  _|    _|    _|      _|    _|  _|    _|  _|        
 _|        _|  _|    _|_|        _|_|    _|_|_|    _|_|_|    _|_|_|  
                                                       _|            
                                                   _|_|                                                                                                                   
  `

  // Print ASCII art first
  process.stdout.write(shell)
  process.stdout.write('\n')

  // Then render Ink component
  render(<LogoDesc />)
}
