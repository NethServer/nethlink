import { SpeedDialsBox } from "./SpeedDialsBox"
import { useEffect, useState } from "react"
import { SpeedDialFormBox } from "./SpeedDialFormBox"
import { SpeedDialDeleteDialog } from "./SpeedDialDeleteDialog"
import { useSpeedDialsModule } from "./hook/useSpeedDialsModule"

export const SpeeddialsModule = () => {

  const speedDialModule = useSpeedDialsModule()
  const [selectedSpeedDial, setSelectedSpeedDial] = speedDialModule.speedDialsState
  const [isSpeedDialFormOpen, setSpeedDialFormOpen] = useState<boolean>(false)
  const [isDeleteSpeedDialDialogOpen, setDeleteSpeedDialDialogOpen] = useState<boolean>(false)

  return (
    <>
      {!(isSpeedDialFormOpen || isDeleteSpeedDialDialogOpen) && <SpeedDialsBox
        showSpeedDialForm={() => setSpeedDialFormOpen(true)}
        showDeleteSpeedDialDialog={() => setDeleteSpeedDialDialogOpen(true)}
      />
      }


      {isSpeedDialFormOpen && <SpeedDialFormBox
        close={() => {
          setSelectedSpeedDial(undefined)
          setSpeedDialFormOpen(false)
        }}
      />
      }

      {isDeleteSpeedDialDialogOpen && <SpeedDialDeleteDialog
        close={() => {
          setSelectedSpeedDial(undefined)
          setDeleteSpeedDialDialogOpen(false)
        }}
      />}

    </>
  )
}
