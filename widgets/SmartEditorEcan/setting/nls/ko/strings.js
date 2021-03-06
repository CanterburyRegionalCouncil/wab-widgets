define({
  "layersPage": {
    "title": "피처를 생성할 템플릿 선택",
    "generalSettings": "일반 설정",
    "layerSettings": "레이어 설정",
    "editDescription": "편집 패널에 대한 표시 텍스트 제공",
    "editDescriptionTip": "이 텍스트는 템플릿 선택기 위에 표시되며 텍스트가 없으면 비워 둡니다.",
    "promptOnSave": "양식이 닫히거나 다음 레코드로 전환되면 저장되지 않은 편집 내용을 저장하라는 메시지가 나타납니다.",
    "promptOnSaveTip": "현재 피처에 저장되지 않은 편집 내용이 있을 때 사용자가 닫기를 클릭하거나 다음 편집 가능 레코드로 이동하는 경우 메시지가 표시됩니다.",
    "promptOnDelete": "레코드를 삭제할 때 확인이 필요합니다.",
    "promptOnDeleteTip": "사용자가 작업을 확인하기 위해 삭제를 클릭하는 경우 메시지가 표시됩니다.",
    "removeOnSave": "저장 시 선택 사항에서 피처를 제거합니다.",
    "removeOnSaveTip": "레코드 저장 시 설정 집합에서 피처를 제거하는 옵션입니다. 유일한 선택 레코드인 경우 패널이 템플릿 페이지로 다시 전환됩니다.",
    "useFilterEditor": "피처 템플릿 필터 사용",
    "useFilterEditorTip": "하나의 레이어 템플릿을 확인하거나 이름별 템플릿을 검색하는 기능을 제공하는 필터 템플릿 선택기를 사용하는 옵션입니다.",
    "listenToGroupFilter": "그룹 필터 위젯의 필터 값을 프리셋 필드에 적용합니다.",
    "listenToGroupFilterTip": "필터가 그룹 필터 위젯에 적용되는 경우 값을 프리셋 값 목록에서 일치 필드에 적용합니다.",
    "keepTemplateActive": "선택한 템플릿 활성 유지",
    "keepTemplateActiveTip": "템플릿이 이전에 선택된 경우에 템플릿 선택기가 표시되면 다시 선택합니다.",
    "layerSettingsTable": {
      "allowDelete": "삭제 허용",
      "allowDeleteTip": "사용자가 피처를 삭제하도록 허용하는 옵션입니다. 레이어가 삭제를 지원하지 않는 경우 비활성화됩니다.",
      "edit": "편집 가능",
      "editTip": "위젯에 레이어를 포함하는 옵션",
      "label": "레이어",
      "labelTip": "맵에 정의된 레이어 이름",
      "update": "지오메트리 편집 비활성화",
      "updateTip": "위치가 지정된 지오메트리를 이동하거나 기존 피처의 지오메트리를 이동하는 기능을 비활성화하는 옵션",
      "allowUpdateOnly": "업데이트만",
      "allowUpdateOnlyTip": "기존 피처의 수정만 허용하는 옵션입니다. 기본적으로 선택되어 있으며, 레이어가 새 피처 생성을 지원하지 않는 경우 비활성화됩니다.",
      "fields": "필드",
      "fieldsTip": "편집할 필드 수정 및 스마트 속성 정의",
      "description": "설명",
      "descriptionTip": "속성 페이지 상단에 표시할 텍스트를 선택적으로 입력합니다."
    },
    "editFieldError": "필드 수정 및 스마트 속성은 편집할 수 없는 레이어에 대해 사용할 수 없음",
    "noConfigedLayersError": "스마트 편집기는 편집 가능한 레이어가 하나 이상 필요합니다."
  },
  "editDescriptionPage": {
    "title": "<b>${layername}</b>에 대한 속성 개요 텍스트 정의 "
  },
  "fieldsPage": {
    "title": "<b>${layername}</b>에 대한 필드 구성",
    "description": "프리셋 열을 사용하여 사용자가 새 피처를 생성하기 전에 값을 입력하도록 허용합니다. 레이어에서 스마트 속성을 활성화하려면 작업 편집 버튼을 사용합니다. 스마트 속성은 다른 필드의 값에 따라 필드를 요구하거나 숨기거나 비활성화할 수 있습니다.",
    "fieldsNotes": "별(*)로 표시된 곳은 필수 필드입니다. 이 필드에 대해 표시를 선택 해제하고 편집 템플릿이 해당 필드값을 채우지 않으면 새 레코드를 저장할 수 없습니다.",
    "fieldsSettingsTable": {
      "display": "표시",
      "displayTip": "필드 표시 여부 결정",
      "edit": "편집 가능",
      "editTip": "필드가 속성 양식에 있는 경우 선택",
      "fieldName": "이름",
      "fieldNameTip": "데이터베이스에 정의된 필드 이름",
      "fieldAlias": "별칭",
      "fieldAliasTip": "맵에 정의된 필드 이름",
      "canPresetValue": "프리셋",
      "canPresetValueTip": "프리셋 필드 목록에 필드를 표시하고 사용자가 편집하기 전에 값을 설정하도록 허용하는 옵션",
      "actions": "작업",
      "actionsTip": "필드 순서를 변경하거나 스마트 속성 설정"
    },
    "smartAttSupport": "스마트 속성은 필수 데이터베이스 필드에서 지원되지 않음"
  },
  "actionPage": {
    "title": "<b>${fieldname}</b>에 대한 스마트 속성 작업 구성",
    "description": "트리거할 기준을 지정하지 않으면 작업은 항상 꺼져 있습니다. 작업은 순서대로 진행되며 필드당 하나의 작업만 트리거됩니다. 기준을 정의하려면 기준 편집 버튼을 사용합니다.",
    "actionsSettingsTable": {
      "rule": "작업",
      "ruleTip": "기준 충족 시 수행되는 작업",
      "expression": "식",
      "expressionTip": "정의된 기준에서 SQL 형식의 결과식",
      "actions": "기준",
      "actionsTip": "트리거 시 규칙 순서 변경 및 기준 정의"
    },
    "actions": {
      "hide": "숨기기",
      "required": "필수",
      "disabled": "비활성화됨"
    }
  },
  "filterPage": {
    "submitHidden": "숨겨져 있을 때도 이 필드에 대한 속성 데이터를 제출하시겠습니까?",
    "title": "${action} 규칙에 대한 식 구성",
    "filterBuilder": "레코드가 다음 식의 ${any_or_all}과 일치할 때 필드에 대한 작업 설정",
    "noFilterTip": "아래의 도구를 사용하여 작업이 활성 상태일 때에 대한 구문을 정의합니다."
  }
});