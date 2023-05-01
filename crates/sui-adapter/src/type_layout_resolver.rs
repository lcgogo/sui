// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use crate::programmable_transactions::context::new_session_for_linkage;
use crate::programmable_transactions::{
    context::load_type,
    linkage_view::{LinkageInfo, LinkageView},
    types::StorageView,
};
use move_core_types::language_storage::{StructTag, TypeTag};
use move_core_types::value::{MoveStructLayout, MoveTypeLayout};
use move_vm_runtime::{move_vm::MoveVM, session::Session};
use sui_types::{
    error::SuiError,
    layout_resolver::LayoutResolver,
    object::{MoveObject, ObjectFormatOptions},
};

/// Retrive a `MoveStructLayout` from a `Type`.
/// Invocation into the `Session` to leverage the `LinkageView` implementation
/// common to the runtime.
pub struct TypeLayoutResolver<'state, 'vm, S: StorageView> {
    session: Session<'state, 'vm, LinkageView<'state, S>>,
}

impl<'state, 'vm, S: StorageView> TypeLayoutResolver<'state, 'vm, S> {
    pub fn new(vm: &'vm MoveVM, state_view: &'state S) -> Self {
        let session = new_session_for_linkage(vm, LinkageView::new(state_view, LinkageInfo::Unset));
        Self { session }
    }
}

impl<'state, 'vm, S: StorageView> LayoutResolver for TypeLayoutResolver<'state, 'vm, S> {
    fn get_layout(
        &mut self,
        object: &MoveObject,
        format: ObjectFormatOptions,
    ) -> Result<MoveStructLayout, SuiError> {
        let struct_tag: StructTag = object.type_().clone().into();
        let type_tag: TypeTag = TypeTag::from(struct_tag.clone());
        let Ok(ty) = load_type(&mut self.session, &type_tag) else {
            return Err(SuiError::FailObjectLayout { st: format!("{}", struct_tag) });
        };
        let layout = if format.include_types() {
            self.session.type_to_fully_annotated_layout(&ty)
        } else {
            self.session.type_to_type_layout(&ty)
        };
        let Ok(MoveTypeLayout::Struct(layout)) = layout else {
            return Err(SuiError::FailObjectLayout {
                st: format!("{}", struct_tag),
            })
        };
        Ok(layout)
    }
}
