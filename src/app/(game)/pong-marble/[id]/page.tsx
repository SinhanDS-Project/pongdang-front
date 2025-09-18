'use client'

import { DiceCard, GameBoard } from '@/components/pong-marble-page'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Bell, Gem, School } from 'lucide-react'
import { useCallback, useReducer } from 'react'

import { GreenTurtleIcon, OrangeTurtleIcon, PinkTurtleIcon, YellowTurtleIcon } from '@/icons'

interface Player {
  id: number
  name: string
  balance: number
  position: number
  color: string
  ownedProperties: number[]
  isInJail: boolean
  jailTurns: number
  isEliminated: boolean
}

interface GameState {
  players: Player[]
  currentPlayerIndex: number
  round: number
  dice: [number, number]
  actionLog: string[]
  vault: number
  gamePhase: 'playing' | 'quiz' | 'purchase' | 'gameOver'
  currentQuiz?: {
    question: string
    options: string[]
    correct: number
  }
  purchaseOption?: {
    squareIndex: number
    price: number
  }
  consecutiveDoubles: number
  isMoving: boolean
  winner?: Player
}

type GameAction =
  | { type: 'ROLL_DICE'; dice: [number, number] }
  | { type: 'MOVE_PLAYER'; playerIndex: number; newPosition: number }
  | { type: 'UPDATE_BALANCE'; playerIndex: number; amount: number }
  | { type: 'PURCHASE_PROPERTY'; playerIndex: number; squareIndex: number; price: number }
  | { type: 'SHOW_QUIZ'; quiz: GameState['currentQuiz'] }
  | { type: 'ANSWER_QUIZ'; correct: boolean }
  | { type: 'SHOW_PURCHASE'; squareIndex: number; price: number }
  | { type: 'CANCEL_PURCHASE' }
  | { type: 'NEXT_TURN' }
  | { type: 'ADD_LOG'; message: string }
  | { type: 'SET_JAIL'; playerIndex: number; inJail: boolean }
  | { type: 'UPDATE_VAULT'; amount: number }
  | { type: 'ELIMINATE_PLAYER'; playerIndex: number }
  | { type: 'END_GAME'; winner: Player }
  | { type: 'SET_MOVING'; isMoving: boolean }

const SQUARE_DATA = [
  { name: '출발', type: 'start', price: 0 },
  { name: '케이', type: 'property', price: 3 },
  { name: '토스', type: 'property', price: 3 },
  { name: '퀴즈', type: 'quiz', price: 0 },
  { name: '수협', type: 'property', price: 4 },
  { name: '카카오', type: 'property', price: 4 },
  { name: '무인도', type: 'jail', price: 0 },
  { name: '한국씨티', type: 'property', price: 5 },
  { name: 'HSBC', type: 'property', price: 5 },
  { name: '웰스파고', type: 'property', price: 6 },
  { name: '퀴즈', type: 'quiz', price: 0 },
  { name: 'im', type: 'property', price: 6 },
  { name: '금고', type: 'vault', price: 0 },
  { name: '제일', type: 'property', price: 7 },
  { name: '산업', type: 'property', price: 7 },
  { name: '저금', type: 'savings', price: 0 },
  { name: '농협', type: 'property', price: 8 },
  { name: '기업', type: 'property', price: 8 },
  { name: '여행', type: 'travel', price: 0 },
  { name: '우리', type: 'property', price: 9 },
  { name: '하나', type: 'property', price: 9 },
  { name: '국민', type: 'property', price: 9 },
  { name: '세금', type: 'tax', price: 0 },
  { name: '신한', type: 'property', price: 10 },
]

const QUIZ_QUESTIONS = [
  {
    question: '대한민국의 수도는?',
    options: ['서울', '부산', '대구', '인천'],
    correct: 0,
  },
  {
    question: '1 + 1은?',
    options: ['1', '2', '3', '4'],
    correct: 1,
  },
  {
    question: '지구에서 가장 큰 대륙은?',
    options: ['아프리카', '아시아', '유럽', '북미'],
    correct: 1,
  },
  {
    question: '태양계에서 가장 큰 행성은?',
    options: ['지구', '화성', '목성', '토성'],
    correct: 2,
  },
]

const initialState: GameState = {
  players: [
    {
      id: 1,
      name: '플레이어 1',
      balance: 80,
      position: 0,
      color: 'red',
      ownedProperties: [],
      isInJail: false,
      jailTurns: 0,
      isEliminated: false,
    },
    {
      id: 2,
      name: '플레이어 2',
      balance: 80,
      position: 0,
      color: 'blue',
      ownedProperties: [],
      isInJail: false,
      jailTurns: 0,
      isEliminated: false,
    },
    {
      id: 3,
      name: '플레이어 3',
      balance: 80,
      position: 0,
      color: 'green',
      ownedProperties: [],
      isInJail: false,
      jailTurns: 0,
      isEliminated: false,
    },
    {
      id: 4,
      name: '플레이어 4',
      balance: 80,
      position: 0,
      color: 'yellow',
      ownedProperties: [],
      isInJail: false,
      jailTurns: 0,
      isEliminated: false,
    },
  ],
  currentPlayerIndex: 0,
  round: 1,
  dice: [1, 1],
  actionLog: ['게임이 시작되었습니다!', '플레이어 1의 차례입니다.'],
  vault: 0,
  gamePhase: 'playing',
  consecutiveDoubles: 0,
  isMoving: false,
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ROLL_DICE':
      return { ...state, dice: action.dice }

    case 'MOVE_PLAYER':
      const newPlayers = [...state.players]
      const oldPosition = newPlayers[action.playerIndex].position
      newPlayers[action.playerIndex].position = action.newPosition

      // 출발 칸을 지나면 15골드 획득
      if (oldPosition > action.newPosition || (oldPosition < 24 && action.newPosition >= 24)) {
        newPlayers[action.playerIndex].balance += 15
      }

      return { ...state, players: newPlayers }

    case 'UPDATE_BALANCE':
      const updatedPlayers = [...state.players]
      updatedPlayers[action.playerIndex].balance += action.amount

      // 파산 체크
      if (updatedPlayers[action.playerIndex].balance <= 0) {
        updatedPlayers[action.playerIndex].isEliminated = true
      }

      return { ...state, players: updatedPlayers }

    case 'PURCHASE_PROPERTY':
      const purchasePlayers = [...state.players]
      purchasePlayers[action.playerIndex].balance -= action.price
      purchasePlayers[action.playerIndex].ownedProperties.push(action.squareIndex)
      return {
        ...state,
        players: purchasePlayers,
        gamePhase: 'playing',
        purchaseOption: undefined,
      }

    case 'SHOW_QUIZ':
      return { ...state, gamePhase: 'quiz', currentQuiz: action.quiz }

    case 'ANSWER_QUIZ':
      const quizPlayers = [...state.players]
      quizPlayers[state.currentPlayerIndex].balance += action.correct ? 5 : -5
      return {
        ...state,
        players: quizPlayers,
        gamePhase: 'playing',
        currentQuiz: undefined,
      }

    case 'SHOW_PURCHASE':
      return {
        ...state,
        gamePhase: 'purchase',
        purchaseOption: { squareIndex: action.squareIndex, price: action.price },
      }

    case 'CANCEL_PURCHASE':
      return {
        ...state,
        gamePhase: 'playing',
        purchaseOption: undefined,
      }

    case 'NEXT_TURN':
      const activePlayers = state.players.filter((p) => !p.isEliminated)
      if (activePlayers.length <= 1) {
        return {
          ...state,
          gamePhase: 'gameOver',
          winner: activePlayers[0] || state.players[0],
        }
      }

      let nextIndex = (state.currentPlayerIndex + 1) % state.players.length
      while (state.players[nextIndex].isEliminated) {
        nextIndex = (nextIndex + 1) % state.players.length
      }

      const newRound = nextIndex === 0 ? state.round + 1 : state.round

      // 10라운드 후 게임 종료
      if (newRound > 10) {
        const finalWinner = [...state.players]
          .filter((p) => !p.isEliminated)
          .sort((a, b) => {
            const aAssets = a.balance + a.ownedProperties.reduce((sum, prop) => sum + SQUARE_DATA[prop].price / 2, 0)
            const bAssets = b.balance + b.ownedProperties.reduce((sum, prop) => sum + SQUARE_DATA[prop].price / 2, 0)
            return bAssets - aAssets
          })[0]

        return {
          ...state,
          gamePhase: 'gameOver',
          winner: finalWinner,
        }
      }

      return {
        ...state,
        currentPlayerIndex: nextIndex,
        round: newRound,
        consecutiveDoubles: 0,
      }

    case 'ADD_LOG':
      return {
        ...state,
        actionLog: [...state.actionLog.slice(-4), action.message],
      }

    case 'SET_JAIL':
      const jailPlayers = [...state.players]
      jailPlayers[action.playerIndex].isInJail = action.inJail
      if (action.inJail) {
        jailPlayers[action.playerIndex].position = 6 // 무인도
        jailPlayers[action.playerIndex].jailTurns = 0
      }
      return { ...state, players: jailPlayers }

    case 'UPDATE_VAULT':
      return { ...state, vault: state.vault + action.amount }

    case 'SET_MOVING':
      return { ...state, isMoving: action.isMoving }

    case 'END_GAME':
      return { ...state, gamePhase: 'gameOver', winner: action.winner }

    default:
      return state
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const rollDice = useCallback(async () => {
    if (state.isMoving || state.gamePhase !== 'playing') return

    const currentPlayer = state.players[state.currentPlayerIndex]
    if (currentPlayer.isEliminated) return

    // 무인도에 있는 경우
    if (currentPlayer.isInJail) {
      const dice1 = Math.floor(Math.random() * 6) + 1
      const dice2 = Math.floor(Math.random() * 6) + 1
      dispatch({ type: 'ROLL_DICE', dice: [dice1, dice2] })

      if (dice1 === dice2) {
        dispatch({ type: 'SET_JAIL', playerIndex: state.currentPlayerIndex, inJail: false })
        dispatch({ type: 'ADD_LOG', message: `${currentPlayer.name}이(가) 더블로 무인도에서 탈출했습니다!` })

        const total = dice1 + dice2
        dispatch({ type: 'SET_MOVING', isMoving: true })

        let currentPos = currentPlayer.position
        for (let i = 0; i < total; i++) {
          setTimeout(
            () => {
              currentPos = (currentPos + 1) % 24
              dispatch({ type: 'MOVE_PLAYER', playerIndex: state.currentPlayerIndex, newPosition: currentPos })

              if (i === total - 1) {
                setTimeout(() => {
                  handleSquareEffect(currentPos)
                  dispatch({ type: 'SET_MOVING', isMoving: false })
                  setTimeout(() => {
                    dispatch({ type: 'NEXT_TURN' })
                  }, 1000)
                }, 500)
              }
            },
            (i + 1) * 300,
          )
        }
      } else {
        const newJailTurns = currentPlayer.jailTurns + 1
        if (newJailTurns >= 2) {
          dispatch({ type: 'SET_JAIL', playerIndex: state.currentPlayerIndex, inJail: false })
          dispatch({ type: 'ADD_LOG', message: `${currentPlayer.name}이(가) 무인도에서 자동 탈출했습니다.` })
        } else {
          const updatedPlayers = [...state.players]
          updatedPlayers[state.currentPlayerIndex].jailTurns = newJailTurns
          dispatch({
            type: 'ADD_LOG',
            message: `${currentPlayer.name}이(가) 무인도에서 ${newJailTurns}턴째 대기 중입니다.`,
          })
        }
        setTimeout(() => {
          dispatch({ type: 'NEXT_TURN' })
        }, 2000)
      }
      return
    }

    const dice1 = Math.floor(Math.random() * 6) + 1
    const dice2 = Math.floor(Math.random() * 6) + 1
    const total = dice1 + dice2
    const isDouble = dice1 === dice2

    dispatch({ type: 'ROLL_DICE', dice: [dice1, dice2] })
    dispatch({ type: 'SET_MOVING', isMoving: true })

    const newConsecutiveDoubles = isDouble ? state.consecutiveDoubles + 1 : 0

    // 3연속 더블이면 무인도로
    if (newConsecutiveDoubles >= 3) {
      dispatch({ type: 'SET_JAIL', playerIndex: state.currentPlayerIndex, inJail: true })
      dispatch({ type: 'ADD_LOG', message: `${currentPlayer.name}이(가) 3연속 더블로 무인도에 갇혔습니다!` })
      dispatch({ type: 'SET_MOVING', isMoving: false })
      setTimeout(() => {
        dispatch({ type: 'NEXT_TURN' })
      }, 2000)
      return
    }

    dispatch({
      type: 'ADD_LOG',
      message: `${currentPlayer.name}이(가) ${dice1}과 ${dice2}를 굴렸습니다 (총 ${total}칸)${isDouble ? ' - 더블!' : ''}`,
    })

    // 애니메이션으로 이동
    let currentPos = currentPlayer.position
    for (let i = 0; i < total; i++) {
      setTimeout(
        () => {
          currentPos = (currentPos + 1) % 24
          dispatch({ type: 'MOVE_PLAYER', playerIndex: state.currentPlayerIndex, newPosition: currentPos })

          if (i === total - 1) {
            // 이동 완료 후 칸 효과 처리
            setTimeout(() => {
              handleSquareEffect(currentPos)
              dispatch({ type: 'SET_MOVING', isMoving: false })

              if (!isDouble && SQUARE_DATA[currentPos].type !== 'travel') {
                setTimeout(() => {
                  dispatch({ type: 'NEXT_TURN' })
                }, 1000)
              } else if (isDouble) {
                dispatch({ type: 'ADD_LOG', message: `더블이므로 한 번 더 굴릴 수 있습니다!` })
              }
            }, 500)
          }
        },
        (i + 1) * 300,
      )
    }
  }, [state])

  const handleSquareEffect = (position: number) => {
    const square = SQUARE_DATA[position]
    const currentPlayer = state.players[state.currentPlayerIndex]

    switch (square.type) {
      case 'property':
        const owner = state.players.find((p) => p.ownedProperties.includes(position))
        if (!owner) {
          // 구매 가능
          if (currentPlayer.balance >= square.price) {
            dispatch({ type: 'SHOW_PURCHASE', squareIndex: position, price: square.price })
          } else {
            dispatch({
              type: 'ADD_LOG',
              message: `${currentPlayer.name}은(는) ${square.name}을(를) 살 돈이 부족합니다.`,
            })
          }
        } else if (owner.id !== currentPlayer.id) {
          // 통행료 지불
          const toll = square.price * 2
          dispatch({ type: 'UPDATE_BALANCE', playerIndex: state.currentPlayerIndex, amount: -toll })
          const ownerIndex = state.players.findIndex((p) => p.id === owner.id)
          dispatch({ type: 'UPDATE_BALANCE', playerIndex: ownerIndex, amount: toll })
          dispatch({
            type: 'ADD_LOG',
            message: `${currentPlayer.name}이(가) ${owner.name}에게 통행료 ${toll}골드를 지불했습니다.`,
          })
        }
        break

      case 'quiz':
        const randomQuiz = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)]
        dispatch({ type: 'SHOW_QUIZ', quiz: randomQuiz })
        break

      case 'tax':
        dispatch({ type: 'UPDATE_BALANCE', playerIndex: state.currentPlayerIndex, amount: -10 })
        dispatch({ type: 'ADD_LOG', message: `${currentPlayer.name}이(가) 세금 10골드를 지불했습니다.` })
        break

      case 'savings':
        dispatch({ type: 'UPDATE_BALANCE', playerIndex: state.currentPlayerIndex, amount: -5 })
        dispatch({ type: 'UPDATE_VAULT', amount: 5 })
        dispatch({ type: 'ADD_LOG', message: `${currentPlayer.name}이(가) 저금 5골드를 했습니다.` })
        break

      case 'vault':
        dispatch({ type: 'UPDATE_BALANCE', playerIndex: state.currentPlayerIndex, amount: state.vault })
        dispatch({
          type: 'ADD_LOG',
          message: `${currentPlayer.name}이(가) 금고에서 ${state.vault}골드를 획득했습니다!`,
        })
        dispatch({ type: 'UPDATE_VAULT', amount: -state.vault })
        break

      case 'travel':
        dispatch({
          type: 'ADD_LOG',
          message: `${currentPlayer.name}이(가) 여행 칸에 도착했습니다! 주사위를 한 번 더 굴릴 수 있습니다.`,
        })
        break

      case 'start':
        dispatch({ type: 'ADD_LOG', message: `${currentPlayer.name}이(가) 출발 칸에 도착했습니다.` })
        break
    }
  }

  const handleQuizAnswer = (answerIndex: number) => {
    const correct = state.currentQuiz?.correct === answerIndex
    dispatch({ type: 'ANSWER_QUIZ', correct })
    dispatch({ type: 'ADD_LOG', message: `퀴즈 ${correct ? '정답' : '오답'}! ${correct ? '+5' : '-5'}골드` })
  }

  const handlePurchase = () => {
    if (state.purchaseOption) {
      dispatch({
        type: 'PURCHASE_PROPERTY',
        playerIndex: state.currentPlayerIndex,
        squareIndex: state.purchaseOption.squareIndex,
        price: state.purchaseOption.price,
      })
      dispatch({
        type: 'ADD_LOG',
        message: `${state.players[state.currentPlayerIndex].name}이(가) ${SQUARE_DATA[state.purchaseOption.squareIndex].name}을(를) 구매했습니다!`,
      })
    }
  }

  const handleCancelPurchase = () => {
    dispatch({ type: 'CANCEL_PURCHASE' })
  }

  return (
    <div className="grid h-full w-full grid-cols-5 gap-4 p-4">
      <div className="grid grid-rows-8 gap-4">
        <Card className="flex items-center justify-center">
          <CardContent className="flex justify-between gap-2 text-xl font-extrabold">
            <div>Round</div>
            <div className="text-primary-shinhan w-8 text-center">{state.round}</div>
            <div>/ 10</div>
          </CardContent>
        </Card>
        <Card className="border-secondary-sky bg-secondary-light/30 ring-secondary-sky/10 row-span-2 border-2 shadow-md ring-2 transition-all">
          <CardHeader className="flex items-center gap-x-4 text-base font-bold">
            <GreenTurtleIcon />
            <span>플레이어1</span>
          </CardHeader>
          <CardContent className="flex grow flex-col justify-between">
            <div className="flex items-center justify-between">
              <Gem className="text-secondary-sky" />
              <div className="text-base font-extrabold">00</div>
              <div className="">퐁</div>
            </div>
            <div className="flex items-center justify-between">
              <School className="text-primary-shinhan" />
              <div className="text-base font-extrabold">00</div>
              <div className="font-semibold">개</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card row-span-2 rounded-lg border-2 transition-all">
          <CardHeader className="flex items-center gap-x-4 text-base font-bold">
            <OrangeTurtleIcon />
            <span>플레이어2</span>
          </CardHeader>
          <CardContent className="flex grow flex-col justify-between">
            <div className="flex items-center justify-between">
              <Gem className="text-gray-400" />
              <div className="text-base font-extrabold">00</div>
              <div className="">퐁</div>
            </div>
            <div className="flex items-center justify-between">
              <School className="text-gray-600" />
              <div className="text-base font-extrabold">00</div>
              <div className="font-semibold">개</div>
            </div>
          </CardContent>
        </Card>
        <Card className="row-span-3 gap-4">
          <CardHeader className="flex items-center gap-x-4 text-base font-bold">
            <Bell />
            <span>알림</span>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              <div className="bg-muted text-muted-foreground border-secondary-sky rounded border-l-2 px-2 py-1 text-sm">
                알림내용입니다.
              </div>
              <div className="bg-muted text-muted-foreground border-secondary-sky rounded border-l-2 px-2 py-1 text-sm">
                알림내용입니다.
              </div>
              <div className="bg-muted text-muted-foreground border-secondary-sky rounded border-l-2 px-2 py-1 text-sm">
                알림내용입니다.
              </div>
              <div className="bg-muted text-muted-foreground border-secondary-sky rounded border-l-2 px-2 py-1 text-sm">
                알림내용입니다.
              </div>
              <div className="bg-muted text-muted-foreground border-secondary-sky rounded border-l-2 px-2 py-1 text-sm">
                알림내용입니다.
              </div>
              <div className="bg-muted text-muted-foreground border-secondary-sky rounded border-l-2 px-2 py-1 text-sm">
                알림내용입니다.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="col-span-3 flex flex-col items-center justify-center">
        <GameBoard players={state.players} squareData={SQUARE_DATA} vault={state.vault} />
      </div>
      <div className="grid grid-rows-8 gap-4">
        <Card className="flex items-center justify-center">
          <CardContent className="text-xl font-extrabold">게임방 이름</CardContent>
        </Card>
        {/* 제거된 플레이어 */}
        <Card className="row-span-2 rounded-lg border-2 border-red-200 bg-red-50 opacity-50 transition-all">
          <CardHeader className="flex items-center gap-x-4 text-base font-bold">
            <PinkTurtleIcon />
            <span>플레이어3</span>
          </CardHeader>
          <CardContent className="flex grow flex-col justify-between">
            <div className="flex items-center justify-between">
              <Gem className="text-gray-400" />
              <div className="text-base font-extrabold">00</div>
              <div className="">퐁</div>
            </div>
            <div className="flex items-center justify-between">
              <School className="text-gray-600" />
              <div className="text-base font-extrabold">00</div>
              <div className="font-semibold">개</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card row-span-2 rounded-lg border-2 transition-all">
          <CardHeader className="flex items-center gap-x-4 text-base font-bold">
            <YellowTurtleIcon />
            <span>플레이어4</span>
          </CardHeader>
          <CardContent className="flex grow flex-col justify-between">
            <div className="flex items-center justify-between">
              <Gem className="text-gray-400" />
              <div className="text-base font-extrabold">00</div>
              <div className="">퐁</div>
            </div>
            <div className="flex items-center justify-between">
              <School className="text-gray-600" />
              <div className="text-base font-extrabold">00</div>
              <div className="font-semibold">개</div>
            </div>
          </CardContent>
        </Card>
        <DiceCard canRoll currentPlayer={{}}></DiceCard>
      </div>
    </div>
  )
  // return (
  //   <div className="min-h-screen bg-background p-4">
  //     <div className="max-w-7xl mx-auto">
  //       <div className="flex gap-6">
  //         <div className="flex-[7]">
  //           <GameBoard players={state.players} squareData={SQUARE_DATA} vault={state.vault} />
  //         </div>

  //         <div className="flex-[3]">
  //           <GamePanel
  //             round={state.round}
  //             dice={state.dice}
  //             actionLog={state.actionLog}
  //             players={state.players}
  //             currentPlayerIndex={state.currentPlayerIndex}
  //             onRollDice={rollDice}
  //             canRoll={!state.isMoving && state.gamePhase === "playing"}
  //             vault={state.vault}
  //           />
  //         </div>
  //       </div>

  //       {state.gamePhase === "quiz" && state.currentQuiz && (
  //         <QuizModal quiz={state.currentQuiz} onAnswer={handleQuizAnswer} />
  //       )}

  //       {state.gamePhase === "purchase" && state.purchaseOption && (
  //         <PurchaseModal
  //           squareName={SQUARE_DATA[state.purchaseOption.squareIndex].name}
  //           price={state.purchaseOption.price}
  //           playerBalance={state.players[state.currentPlayerIndex].balance}
  //           onPurchase={handlePurchase}
  //           onCancel={handleCancelPurchase}
  //         />
  //       )}

  //       {state.gamePhase === "gameOver" && state.winner && (
  //         <GameOverModal winner={state.winner} players={state.players} squareData={SQUARE_DATA} />
  //       )}
  //     </div>
  //   </div>
  // )
}
